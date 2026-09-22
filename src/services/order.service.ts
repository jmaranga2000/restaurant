import "server-only";
import { OrderRepository } from "@/repositories/order.repository";
import { ProductRepository } from "@/repositories/product.repository";
import { OrganizationModel } from "@/models/Organization";
import { OrderModel } from "@/models/Order";
import { TableModel } from "@/models/Table";
import { CustomerModel } from "@/models/Customer";
import { LoyaltyTransactionModel } from "@/models/LoyaltyTransaction";
import { connectToDatabase } from "@/lib/db";
import { AuditService } from "@/services/audit.service";
import { InventoryService } from "@/services/inventory.service";
import { publishEvent, branchChannel, REALTIME_EVENTS, type RealtimeEventName } from "@/lib/realtime";
import { requirePermissions, requireBranchAccess, type AuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { canTransition, type KitchenItemStatus, type OrderStatus } from "@/types/order";
import type { CreateOrderInput, RecordPaymentInput, RefundPaymentInput } from "@/validations/order.schema";
import { BusinessRuleError, ConflictError, NotFoundError } from "@/lib/errors";

const STATUS_EVENT_MAP: Partial<Record<OrderStatus, RealtimeEventName>> = {
  CONFIRMED: REALTIME_EVENTS.ORDER_CONFIRMED,
  PREPARING: REALTIME_EVENTS.ORDER_PREPARING,
  READY: REALTIME_EVENTS.ORDER_READY,
  SERVED: REALTIME_EVENTS.ORDER_COMPLETED,
  COMPLETED: REALTIME_EVENTS.ORDER_COMPLETED,
  CANCELLED: REALTIME_EVENTS.ORDER_CANCELLED,
};

type StoredOrderItem = {
  _id?: unknown;
  productId: unknown;
  variantId?: unknown;
  nameSnapshot: string;
  unitPriceMinor: number;
  quantity: number;
  modifiers?: { name: string; priceMinor: number }[];
  notes?: string;
  kitchenStation?: string;
  itemStatus?: "NEW" | "PREPARING" | "READY" | "COMPLETED";
};

type StoredPayment = {
  method: string;
  amountMinor: number;
  reference?: string;
  note?: string;
  receivedAt?: Date | string;
};

function plainItems(items: unknown): StoredOrderItem[] {
  return JSON.parse(JSON.stringify(items)) as StoredOrderItem[];
}

function plainPayments(payments: unknown): StoredPayment[] {
  return JSON.parse(JSON.stringify(payments ?? [])) as StoredPayment[];
}

function subtotalFor(items: StoredOrderItem[]): number {
  return items.reduce((sum, item) => sum + item.unitPriceMinor * item.quantity, 0);
}

function calculateTotals({
  subtotalMinor,
  discountPercent,
  taxRatePercent,
  serviceChargePercent,
  applyTax,
  applyServiceCharge,
}: {
  subtotalMinor: number;
  discountPercent: number;
  taxRatePercent: number;
  serviceChargePercent: number;
  applyTax: boolean;
  applyServiceCharge: boolean;
}) {
  const discountMinor = Math.round((subtotalMinor * discountPercent) / 100);
  const taxableSubtotalMinor = Math.max(0, subtotalMinor - discountMinor);
  const taxMinor = applyTax ? Math.round((taxableSubtotalMinor * taxRatePercent) / 100) : 0;
  const serviceChargeMinor = applyServiceCharge
    ? Math.round((taxableSubtotalMinor * serviceChargePercent) / 100)
    : 0;
  return {
    subtotalMinor,
    discountMinor,
    taxMinor,
    serviceChargeMinor,
    totalMinor: taxableSubtotalMinor + taxMinor + serviceChargeMinor,
  };
}

async function findScopedOrder(ctx: AuthContext, orderId: string) {
  await connectToDatabase();
  const order = await OrderModel.findOne({ _id: orderId, organizationId: ctx.organizationId });
  if (!order) throw new NotFoundError("Order");
  requireBranchAccess(ctx, String(order.branchId));
  return order;
}

async function ensureTable(ctx: AuthContext, branchId: string, tableId: string) {
  const table = await TableModel.findOne({ _id: tableId, organizationId: ctx.organizationId, branchId });
  if (!table) throw new NotFoundError("Table");
  return table;
}

async function clearTableWhenNoOpenOrders(ctx: AuthContext, branchId: string, tableId: string, exceptOrderId?: string) {
  const otherOpenOrders = await OrderModel.exists({
    organizationId: ctx.organizationId,
    branchId,
    tableId,
    ...(exceptOrderId ? { _id: { $ne: exceptOrderId } } : {}),
    status: { $in: ["DRAFT", "PLACED", "CONFIRMED", "PREPARING", "READY", "SERVED"] },
  });
  if (!otherOpenOrders) {
    await TableModel.updateOne(
      { _id: tableId, organizationId: ctx.organizationId, branchId },
      { $set: { status: "AVAILABLE" } }
    );
  }
}

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

    if (input.orderType === "DINE_IN" && !input.tableId) {
      throw new BusinessRuleError("Choose a table for a dine-in order.");
    }
    if (input.tableId) await ensureTable(ctx, input.branchId, input.tableId);
    if (input.customerId) {
      const customer = await CustomerModel.exists({ _id: input.customerId, organizationId: ctx.organizationId, isActive: true });
      if (!customer) throw new NotFoundError("Customer");
    }
    if ((input.discountPercent ?? 0) > 0) requirePermissions(ctx, PERMISSIONS.POS_DISCOUNT);

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

    const totals = calculateTotals({
      subtotalMinor,
      discountPercent: input.discountPercent ?? 0,
      taxRatePercent: org.settings?.taxRatePercent ?? 0,
      serviceChargePercent: org.settings?.serviceChargePercent ?? 0,
      applyTax: input.applyTax ?? !org.settings?.pricesIncludeTax,
      applyServiceCharge: input.applyServiceCharge ?? true,
    });

    const orderNumber = await OrderRepository.nextOrderNumber({
      organizationId: ctx.organizationId,
      branchId: input.branchId,
    });

    const order = await OrderRepository.create({
      organizationId: ctx.organizationId,
      branchId: input.branchId,
      orderNumber,
      orderType: input.orderType,
      status: input.submitMode === "HOLD" ? "DRAFT" : "PLACED",
      tableId: input.tableId,
      customerId: input.customerId,
      notes: input.notes,
      items: priced,
      ...totals,
      currency: org.defaultCurrency,
      idempotencyKey: input.idempotencyKey,
      placedBy: ctx.userId,
      createdBy: ctx.userId,
    });

    if (input.tableId) {
      await TableModel.updateOne(
        { _id: input.tableId, organizationId: ctx.organizationId, branchId: input.branchId },
        { $set: { status: "OCCUPIED" } }
      );
    }

    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId: input.branchId,
      actorId: ctx.userId,
      action: "order.created",
      entityType: "Order",
      entityId: String(order._id),
      after: { status: order.status, totalMinor: order.totalMinor, orderNumber: order.orderNumber, discountMinor: order.discountMinor },
    });

    if (order.status === "PLACED") {
      await publishEvent(
        REALTIME_EVENTS.ORDER_CREATED,
        branchChannel(input.branchId, "kitchen"),
        ctx.organizationId,
        input.branchId,
        { orderId: String(order._id), orderNumber: order.orderNumber }
      );
    }

    return order;
  },

  /**
   * The only way an order's status may change. Consults
   * ORDER_STATUS_TRANSITIONS so no caller can push an order through an
   * invalid transition, consumes inventory when an order starts preparing,
   * records an audit entry, and publishes the matching realtime event.
   */
  async transitionStatus(ctx: AuthContext, orderId: string, nextStatus: OrderStatus, reason?: string) {
    const kitchenTransition = nextStatus === "PREPARING" || nextStatus === "READY" || nextStatus === "SERVED";
    requirePermissions(ctx, nextStatus === "CANCELLED" ? PERMISSIONS.ORDERS_CANCEL : kitchenTransition ? PERMISSIONS.KITCHEN_ACCESS : PERMISSIONS.ORDERS_UPDATE);
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

    if (["COMPLETED", "CANCELLED", "VOIDED", "REFUNDED"].includes(nextStatus) && order.tableId) {
      await clearTableWhenNoOpenOrders(ctx, String(order.branchId), String(order.tableId), String(order._id));
    }

    return order;
  },

  /**
   * Moves items, rather than the entire sale, through a kitchen station. The
   * commercial order lifecycle is then advanced only when its item progress
   * makes that transition true. This is what lets Grill and Drinks prepare
   * different parts of order #1045 at the same time.
   */
  async updateKitchenItems(ctx: AuthContext, orderId: string, itemIds: string[], nextStatus: Exclude<KitchenItemStatus, "NEW">) {
    requirePermissions(ctx, PERMISSIONS.KITCHEN_ACCESS);
    const order = await findScopedOrder(ctx, orderId);
    if (["DRAFT", "CANCELLED", "VOIDED", "REFUNDED", "SERVED", "COMPLETED"].includes(order.status)) {
      throw new BusinessRuleError("This order is no longer active in the kitchen.");
    }

    const selected = new Set(itemIds);
    const selectedItems = order.items.filter((item) => selected.has(String(item._id)));
    if (selectedItems.length !== selected.size) throw new NotFoundError("Kitchen item");

    const fallbackStatus = (itemStatus: OrderStatus): KitchenItemStatus => {
      if (itemStatus === "READY") return "READY";
      if (itemStatus === "PREPARING") return "PREPARING";
      return "NEW";
    };
    const allowedPrevious: Record<Exclude<KitchenItemStatus, "NEW">, KitchenItemStatus> = {
      PREPARING: "NEW",
      READY: "PREPARING",
      COMPLETED: "READY",
    };

    for (const item of selectedItems) {
      const current = item.kitchenStatus ?? fallbackStatus(order.status as OrderStatus);
      if (current !== allowedPrevious[nextStatus]) {
        throw new ConflictError(`This item is ${current.toLowerCase()} and cannot move directly to ${nextStatus.toLowerCase()}.`);
      }
      item.kitchenStatus = nextStatus;
      if (nextStatus === "PREPARING") item.kitchenStartedAt = new Date();
      if (nextStatus === "READY") item.kitchenReadyAt = new Date();
      if (nextStatus === "COMPLETED") item.kitchenCompletedAt = new Date();
    }

    const itemStatuses = order.items.map((item) => item.kitchenStatus ?? fallbackStatus(order.status as OrderStatus));
    const previousStatus = order.status as OrderStatus;
    let derivedStatus: OrderStatus | null = null;
    if (itemStatuses.every((status) => status === "COMPLETED")) derivedStatus = "SERVED";
    else if (itemStatuses.every((status) => status === "READY" || status === "COMPLETED")) derivedStatus = "READY";
    else if (itemStatuses.some((status) => status !== "NEW") && (previousStatus === "PLACED" || previousStatus === "CONFIRMED")) derivedStatus = "PREPARING";

    if (derivedStatus && derivedStatus !== previousStatus) {
      // Advance through every commercial lifecycle state rather than trying to
      // jump from PLACED straight to READY. That keeps the KDS, the customer
      // display, and older in-progress tickets in agreement.
      const kitchenLifecycle: OrderStatus[] = ["PLACED", "CONFIRMED", "PREPARING", "READY", "SERVED"];
      const currentIndex = kitchenLifecycle.indexOf(order.status as OrderStatus);
      const targetIndex = kitchenLifecycle.indexOf(derivedStatus);

      if (currentIndex >= 0 && targetIndex > currentIndex) {
        for (let index = currentIndex + 1; index <= targetIndex; index += 1) {
          const nextOrderStatus = kitchenLifecycle[index]!;
          if (!canTransition(order.status as OrderStatus, nextOrderStatus)) break;

          if (nextOrderStatus === "PREPARING") {
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

          order.status = nextOrderStatus;
        }
      }
    }

    order.updatedBy = ctx.userId as unknown as typeof order.updatedBy;
    await order.save();
    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId: String(order.branchId),
      actorId: ctx.userId,
      action: "order.kitchen_items_updated",
      entityType: "Order",
      entityId: String(order._id),
      before: { status: previousStatus },
      after: { status: order.status, itemIds, kitchenStatus: nextStatus },
    });

    const eventName = STATUS_EVENT_MAP[order.status as OrderStatus];
    if (eventName) {
      const branchId = String(order.branchId);
      const payload = { orderId: String(order._id), orderNumber: order.orderNumber, status: order.status, itemIds, kitchenStatus: nextStatus };
      await publishEvent(eventName, branchChannel(branchId, "kitchen"), ctx.organizationId, branchId, payload);
      await publishEvent(eventName, branchChannel(branchId, "display"), ctx.organizationId, branchId, payload);
      await publishEvent(eventName, branchChannel(branchId, "pos"), ctx.organizationId, branchId, payload);
    }
    return order;
  },

  /** Sends a held ticket to the kitchen without rebuilding its items in the browser. */
  async sendHeldOrder(ctx: AuthContext, orderId: string) {
    const order = await OrderService.transitionStatus(ctx, orderId, "PLACED");
    const branchId = String(order.branchId);
    await publishEvent(
      REALTIME_EVENTS.ORDER_CREATED,
      branchChannel(branchId, "kitchen"),
      ctx.organizationId,
      branchId,
      { orderId: String(order._id), orderNumber: order.orderNumber }
    );
    return order;
  },

  /** Adds a tender to an order. Multiple calls intentionally support partial and split payments. */
  async recordPayment(ctx: AuthContext, input: RecordPaymentInput) {
    requirePermissions(ctx, PERMISSIONS.POS_ACCESS, PERMISSIONS.PAYMENTS_COLLECT);
    const order = await findScopedOrder(ctx, input.orderId);
    if (["DRAFT", "CANCELLED", "VOIDED", "REFUNDED"].includes(order.status)) {
      throw new BusinessRuleError("Send an active order before recording a payment.");
    }

    const organization = await OrganizationModel.findById(ctx.organizationId).lean();
    if (!organization) throw new NotFoundError("Organization");
    const configuredMethods = organization.settings?.paymentMethods ?? [];
    const hasConfiguredMethods = configuredMethods.length > 0;
    const allowedMethod = configuredMethods.some((method) => method.enabled && method.code === input.method);
    if (hasConfiguredMethods && !allowedMethod) {
      throw new BusinessRuleError("That payment method is disabled for this restaurant.");
    }

    const payments = plainPayments(order.payments);
    const paidMinor = payments.reduce((sum, payment) => sum + payment.amountMinor, 0);
    const balanceMinor = Math.max(0, order.totalMinor - paidMinor);
    if (balanceMinor === 0) throw new BusinessRuleError("This order has already been paid in full.");
    if (input.amountMinor > balanceMinor) {
      throw new BusinessRuleError(`The outstanding balance is ${balanceMinor} minor units. Record change separately before closing the sale.`);
    }

    payments.push({
      method: input.method,
      amountMinor: input.amountMinor,
      reference: input.reference || undefined,
      note: input.note || undefined,
      receivedAt: new Date(),
    });
    order.set("payments", payments);
    order.updatedBy = ctx.userId as unknown as typeof order.updatedBy;
    await order.save();

    const totalPaidMinor = paidMinor + input.amountMinor;
    // Reward a member only when the ticket becomes fully paid. This is a
    // ledger entry rather than a hidden balance edit, which makes the points
    // available to the cashier's Loyalty screen and keeps retries safe.
    let loyaltyPointsAwarded = 0;
    if (order.customerId && totalPaidMinor >= order.totalMinor) {
      const eligiblePoints = Math.floor(order.totalMinor / 10_000); // 1 point per KSh 100
      if (eligiblePoints > 0) {
        const alreadyRewarded = await LoyaltyTransactionModel.exists({ organizationId: ctx.organizationId, orderId: order._id, type: "EARN" });
        if (!alreadyRewarded) {
          const customer = await CustomerModel.findOne({ _id: order.customerId, organizationId: ctx.organizationId, isActive: true });
          if (customer) {
            const balanceAfter = (customer.loyaltyPoints ?? 0) + eligiblePoints;
            customer.loyaltyPoints = balanceAfter;
            await customer.save();
            await LoyaltyTransactionModel.create({
              organizationId: ctx.organizationId,
              branchId: order.branchId,
              customerId: customer._id,
              orderId: order._id,
              type: "EARN",
              points: eligiblePoints,
              balanceAfter,
              reason: `Order #${order.orderNumber} paid`,
              createdBy: ctx.userId,
            });
            loyaltyPointsAwarded = eligiblePoints;
          }
        }
      }
    }
    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId: String(order.branchId),
      actorId: ctx.userId,
      action: "order.payment_recorded",
      entityType: "Order",
      entityId: String(order._id),
      after: { method: input.method, amountMinor: input.amountMinor, totalPaidMinor, balanceMinor: order.totalMinor - totalPaidMinor, loyaltyPointsAwarded },
    });

    return { order, totalPaidMinor, balanceMinor: order.totalMinor - totalPaidMinor };
  },

  /** Refunds are negative tender entries, preserving a complete payment audit trail. */
  async refundPayment(ctx: AuthContext, input: RefundPaymentInput) {
    requirePermissions(ctx, PERMISSIONS.POS_REFUND);
    const order = await findScopedOrder(ctx, input.orderId);
    if (["DRAFT", "CANCELLED", "VOIDED", "REFUNDED"].includes(order.status)) {
      throw new BusinessRuleError("This order cannot be refunded.");
    }

    const payments = plainPayments(order.payments);
    const netPaidMinor = payments.reduce((sum, payment) => sum + payment.amountMinor, 0);
    if (netPaidMinor <= 0) throw new BusinessRuleError("There is no captured payment to refund.");
    if (input.amountMinor > netPaidMinor) throw new BusinessRuleError("A refund cannot exceed the payment received.");

    payments.push({
      method: input.method,
      amountMinor: -input.amountMinor,
      reference: input.reference || undefined,
      note: `Refund: ${input.reason}`,
      receivedAt: new Date(),
    });
    const remainingPaidMinor = netPaidMinor - input.amountMinor;
    order.set("payments", payments);
    if (remainingPaidMinor === 0 && order.status === "COMPLETED") {
      order.status = "REFUNDED";
    }
    order.updatedBy = ctx.userId as unknown as typeof order.updatedBy;
    await order.save();

    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId: String(order.branchId),
      actorId: ctx.userId,
      action: "order.refunded",
      entityType: "Order",
      entityId: String(order._id),
      after: { method: input.method, amountMinor: input.amountMinor, reason: input.reason, remainingPaidMinor },
    });
    return { order, totalPaidMinor: remainingPaidMinor, balanceMinor: order.totalMinor - remainingPaidMinor };
  },

  async transferTable(ctx: AuthContext, orderId: string, tableId: string) {
    requirePermissions(ctx, PERMISSIONS.ORDERS_UPDATE);
    const order = await findScopedOrder(ctx, orderId);
    if (["COMPLETED", "CANCELLED", "VOIDED", "REFUNDED"].includes(order.status)) {
      throw new BusinessRuleError("Only an active order can be transferred.");
    }
    await ensureTable(ctx, String(order.branchId), tableId);
    const previousTableId = order.tableId ? String(order.tableId) : undefined;
    order.tableId = tableId as unknown as typeof order.tableId;
    order.updatedBy = ctx.userId as unknown as typeof order.updatedBy;
    await order.save();
    await TableModel.updateOne(
      { _id: tableId, organizationId: ctx.organizationId, branchId: order.branchId },
      { $set: { status: "OCCUPIED" } }
    );
    if (previousTableId && previousTableId !== tableId) {
      await clearTableWhenNoOpenOrders(ctx, String(order.branchId), previousTableId, String(order._id));
    }
    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId: String(order.branchId),
      actorId: ctx.userId,
      action: "order.table_transferred",
      entityType: "Order",
      entityId: String(order._id),
      before: { tableId: previousTableId },
      after: { tableId },
    });
    return order;
  },

  async voidOrder(ctx: AuthContext, orderId: string, reason: string) {
    const order = await findScopedOrder(ctx, orderId);
    const nextStatus: OrderStatus = order.status === "DRAFT" ? "VOIDED" : "CANCELLED";
    const updated = await OrderService.transitionStatus(ctx, orderId, nextStatus, reason);
    return updated;
  },

  /** Splits selected items from a held ticket into a second held ticket. */
  async splitHeldOrder(ctx: AuthContext, orderId: string, itemIds: string[]) {
    requirePermissions(ctx, PERMISSIONS.ORDERS_UPDATE);
    const order = await findScopedOrder(ctx, orderId);
    if (order.status !== "DRAFT") throw new BusinessRuleError("Only held orders can be split. Hold the order first if it is still being edited.");
    if (plainPayments(order.payments).length) throw new BusinessRuleError("A ticket with payments cannot be split.");

    const sourceItems = plainItems(order.items);
    const selected = new Set(itemIds);
    const movedItems = sourceItems.filter((item) => item._id && selected.has(String(item._id)));
    if (movedItems.length !== selected.size) throw new NotFoundError("Selected order item");
    const remainingItems = sourceItems.filter((item) => !item._id || !selected.has(String(item._id)));

    const organization = await OrganizationModel.findById(ctx.organizationId).lean();
    if (!organization) throw new NotFoundError("Organization");
    const sourceSubtotal = subtotalFor(sourceItems);
    const discountPercent = sourceSubtotal > 0 ? (order.discountMinor / sourceSubtotal) * 100 : 0;
    const pricingFor = (items: StoredOrderItem[]) => calculateTotals({
      subtotalMinor: subtotalFor(items),
      discountPercent,
      taxRatePercent: organization.settings?.taxRatePercent ?? 0,
      serviceChargePercent: organization.settings?.serviceChargePercent ?? 0,
      applyTax: order.taxMinor > 0,
      applyServiceCharge: order.serviceChargeMinor > 0,
    });
    const nextOrderNumber = await OrderRepository.nextOrderNumber({ organizationId: ctx.organizationId, branchId: String(order.branchId) });
    const splitOrder = await OrderRepository.create({
      organizationId: order.organizationId,
      branchId: order.branchId,
      orderNumber: nextOrderNumber,
      orderType: order.orderType,
      status: "DRAFT",
      tableId: order.tableId,
      customerId: order.customerId,
      notes: order.notes,
      items: movedItems.map(({ _id, ...item }) => item),
      ...pricingFor(movedItems),
      currency: order.currency,
      placedBy: ctx.userId,
      createdBy: ctx.userId,
    });

    if (remainingItems.length === 0) {
      order.status = "VOIDED";
      order.cancelledReason = `Split into order #${splitOrder.orderNumber}`;
    } else {
      order.set("items", remainingItems.map(({ _id, ...item }) => item));
      order.set(pricingFor(remainingItems));
    }
    order.updatedBy = ctx.userId as unknown as typeof order.updatedBy;
    await order.save();
    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId: String(order.branchId),
      actorId: ctx.userId,
      action: "order.split",
      entityType: "Order",
      entityId: String(order._id),
      after: { splitOrderId: String(splitOrder._id), splitOrderNumber: splitOrder.orderNumber },
    });
    return splitOrder;
  },

  /** Merges one held ticket into another while keeping the merged ticket as an auditable void. */
  async mergeHeldOrders(ctx: AuthContext, primaryOrderId: string, secondaryOrderId: string) {
    requirePermissions(ctx, PERMISSIONS.ORDERS_UPDATE);
    const [primary, secondary] = await Promise.all([findScopedOrder(ctx, primaryOrderId), findScopedOrder(ctx, secondaryOrderId)]);
    if (primary.status !== "DRAFT" || secondary.status !== "DRAFT") {
      throw new BusinessRuleError("Only held orders can be merged.");
    }
    if (String(primary.branchId) !== String(secondary.branchId)) throw new BusinessRuleError("Orders from different branches cannot be merged.");
    if (plainPayments(primary.payments).length || plainPayments(secondary.payments).length) throw new BusinessRuleError("Orders with payments cannot be merged.");

    const organization = await OrganizationModel.findById(ctx.organizationId).lean();
    if (!organization) throw new NotFoundError("Organization");
    const mergedItems = [...plainItems(primary.items), ...plainItems(secondary.items)];
    const mergedSubtotal = subtotalFor(mergedItems);
    const discountPercent = primary.subtotalMinor > 0 ? (primary.discountMinor / primary.subtotalMinor) * 100 : 0;
    const totals = calculateTotals({
      subtotalMinor: mergedSubtotal,
      discountPercent,
      taxRatePercent: organization.settings?.taxRatePercent ?? 0,
      serviceChargePercent: organization.settings?.serviceChargePercent ?? 0,
      applyTax: primary.taxMinor > 0,
      applyServiceCharge: primary.serviceChargeMinor > 0,
    });
    primary.set("items", mergedItems.map(({ _id, ...item }) => item));
    primary.set(totals);
    primary.updatedBy = ctx.userId as unknown as typeof primary.updatedBy;
    secondary.status = "VOIDED";
    secondary.cancelledReason = `Merged into order #${primary.orderNumber}`;
    secondary.updatedBy = ctx.userId as unknown as typeof secondary.updatedBy;
    await Promise.all([primary.save(), secondary.save()]);
    await AuditService.record({
      organizationId: ctx.organizationId,
      branchId: String(primary.branchId),
      actorId: ctx.userId,
      action: "order.merged",
      entityType: "Order",
      entityId: String(primary._id),
      after: { mergedOrderId: String(secondary._id), mergedOrderNumber: secondary.orderNumber },
    });
    return primary;
  },
};
