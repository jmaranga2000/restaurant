import "server-only";
import { OrderRepository } from "@/repositories/order.repository";
import { ProductRepository } from "@/repositories/product.repository";
import { OrganizationModel } from "@/models/Organization";
import { connectToDatabase } from "@/lib/db";
import { AuditService } from "@/services/audit.service";
import { InventoryService } from "@/services/inventory.service";
import { publishEvent, branchChannel, REALTIME_EVENTS, type RealtimeEventName } from "@/lib/realtime";
import { requirePermissions, requireBranchAccess, type AuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { canTransition, type OrderStatus } from "@/types/order";
import type { CreateOrderInput } from "@/validations/order.schema";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";

const STATUS_EVENT_MAP: Partial<Record<OrderStatus, RealtimeEventName>> = {
  CONFIRMED: REALTIME_EVENTS.ORDER_CONFIRMED,
  PREPARING: REALTIME_EVENTS.ORDER_PREPARING,
  READY: REALTIME_EVENTS.ORDER_READY,
  COMPLETED: REALTIME_EVENTS.ORDER_COMPLETED,
  CANCELLED: REALTIME_EVENTS.ORDER_CANCELLED,
};

export const OrderService = {
  /**
   * Creates an order. Every price comes from the current Product record —
   * the client only ever sends productId/variantId/quantity/modifier
   * *selections*, never amounts. Idempotent: resubmitting the same
   * idempotencyKey (e.g. after a dropped POS network response) returns the
   * original order instead of creating a duplicate.
   */
  async createOrder(ctx: AuthContext, input: CreateOrderInput) {
    requirePermissions(ctx, PERMISSIONS.ORDERS_CREATE);
    requireBranchAccess(ctx, input.branchId);
    await connectToDatabase();

    if (input.idempotencyKey) {
      const existing = await OrderRepository.findByIdempotencyKey(
        { organizationId: ctx.organizationId, branchId: input.branchId },
        input.idempotencyKey
      );
      if (existing) return existing;
    }

    const org = await OrganizationModel.findById(ctx.organizationId).lean();
    if (!org) throw new NotFoundError("Organization");

    const productIds = [...new Set(input.items.map((i) => i.productId))];
    const products = await ProductRepository.findManyByIds(ctx.organizationId, productIds);
    const productById = new Map(products.map((p) => [String(p._id), p]));

    let subtotalMinor = 0;
    const priced = input.items.map((line) => {
      const product = productById.get(line.productId);
      if (!product) throw new BusinessRuleError("One of the selected items is no longer available.");

      const variant = line.variantId
        ? product.variants.find((v) => String(v._id) === line.variantId)
        : product.variants.find((v) => v.isDefault) ?? product.variants[0];

      const basePriceMinor = variant?.priceMinor ?? 0;

      const chosenModifiers = product.modifierGroups
        .flatMap((g) => g.options)
        .filter((o) => line.modifierOptionIds.includes(String(o._id)))
        .map((o) => ({ name: o.name, priceMinor: o.priceMinor }));

      const modifiersTotal = chosenModifiers.reduce((sum, m) => sum + m.priceMinor, 0);
      const lineTotal = (basePriceMinor + modifiersTotal) * line.quantity;
      subtotalMinor += lineTotal;

      return {
        productId: product._id,
        variantId: variant?._id,
        nameSnapshot: variant ? `${product.name} (${variant.name})` : product.name,
        unitPriceMinor: basePriceMinor + modifiersTotal,
        quantity: line.quantity,
        modifiers: chosenModifiers,
        notes: line.notes,
        kitchenStation: product.kitchenStation,
        itemStatus: "NEW" as const,
      };
    });

    const taxMinor = Math.round((subtotalMinor * (org.settings?.taxRatePercent ?? 0)) / 100);
    const serviceChargeMinor = Math.round((subtotalMinor * (org.settings?.serviceChargePercent ?? 0)) / 100);
    const totalMinor = subtotalMinor + taxMinor + serviceChargeMinor;

    const orderNumber = await OrderRepository.nextOrderNumber({
      organizationId: ctx.organizationId,
      branchId: input.branchId,
    });

    const order = await OrderRepository.create({
      organizationId: ctx.organizationId,
      branchId: input.branchId,
      orderNumber,
      orderType: input.orderType,
      status: "PLACED",
      tableId: input.tableId,
      customerId: input.customerId,
      items: priced,
      subtotalMinor,
      discountMinor: 0,
      taxMinor,
      serviceChargeMinor,
      totalMinor,
      currency: org.defaultCurrency,
      idempotencyKey: input.idempotencyKey,
      placedBy: ctx.userId,
      createdBy: ctx.userId,
    });

    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId: input.branchId,
      actorId: ctx.userId,
      action: "order.created",
      entityType: "Order",
      entityId: String(order._id),
      after: { status: order.status, totalMinor: order.totalMinor, orderNumber: order.orderNumber },
    });

    await publishEvent(
      REALTIME_EVENTS.ORDER_CREATED,
      branchChannel(input.branchId, "kitchen"),
      ctx.organizationId,
      input.branchId,
      { orderId: String(order._id), orderNumber: order.orderNumber }
    );

    return order;
  },

  /**
   * The only way an order's status may change. Consults
   * ORDER_STATUS_TRANSITIONS so no caller can push an order through an
   * invalid transition, consumes inventory when an order starts preparing,
   * records an audit entry, and publishes the matching realtime event.
   */
  async transitionStatus(ctx: AuthContext, orderId: string, nextStatus: OrderStatus, reason?: string) {
    requirePermissions(ctx, nextStatus === "CANCELLED" ? PERMISSIONS.ORDERS_CANCEL : PERMISSIONS.ORDERS_UPDATE);
    await connectToDatabase();

    if (!ctx.activeBranchId) throw new BusinessRuleError("No active branch selected for this session.");
    requireBranchAccess(ctx, ctx.activeBranchId);

    const order = await OrderRepository.findById(
      { organizationId: ctx.organizationId, branchId: ctx.activeBranchId },
      orderId
    );
    if (!order) throw new NotFoundError("Order");

    if (!canTransition(order.status as OrderStatus, nextStatus)) {
      throw new ConflictError(`Cannot move an order from ${order.status} to ${nextStatus}.`);
    }

    if (nextStatus === "PREPARING") {
      for (const item of order.items) {
        const product = await ProductRepository.findById(ctx.organizationId, String(item.productId));
        if (!product) continue;
        for (const line of product.recipe) {
          await InventoryService.consumeForOrderItem({
            organizationId: ctx.organizationId,
            branchId: String(order.branchId),
            orderId: String(order._id),
            inventoryItemId: String(line.inventoryItemId),
            quantity: line.quantity * item.quantity,
            performedBy: ctx.userId,
          });
        }
      }
    }

    const previousStatus = order.status;
    order.status = nextStatus;
    order.updatedBy = ctx.userId as unknown as typeof order.updatedBy;
    if (nextStatus === "CANCELLED") order.cancelledReason = reason;
    await order.save();

    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId: String(order.branchId),
      actorId: ctx.userId,
      action: "order.status_changed",
      entityType: "Order",
      entityId: String(order._id),
      before: { status: previousStatus },
      after: { status: nextStatus, reason },
    });

    const eventName = STATUS_EVENT_MAP[nextStatus];
    if (eventName) {
      const payload = { orderId: String(order._id), orderNumber: order.orderNumber, status: nextStatus };
      const branchId = String(order.branchId);
      await publishEvent(eventName, branchChannel(branchId, "kitchen"), ctx.organizationId, branchId, payload);
      await publishEvent(eventName, branchChannel(branchId, "display"), ctx.organizationId, branchId, payload);
      await publishEvent(eventName, branchChannel(branchId, "pos"), ctx.organizationId, branchId, payload);
    }

    return order;
  },
};
