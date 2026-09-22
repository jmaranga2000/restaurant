import "server-only";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { InventoryItemModel } from "@/models/InventoryItem";
import { StockMovementModel, type StockMovementType } from "@/models/StockMovement";
import { BusinessRuleError } from "@/lib/errors";
import { publishEvent, branchChannel, REALTIME_EVENTS } from "@/lib/realtime";
import { requirePermissions, requireBranchAccess, type AuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";

export interface StockMovementInput {
  organizationId: string;
  branchId: string;
  inventoryItemId: string;
  type: StockMovementType;
  quantity: number; // signed
  unitCostMinor?: number;
  reference: { kind: "ORDER" | "PURCHASE_ORDER" | "TRANSFER" | "MANUAL"; id?: string };
  note?: string;
  performedBy: string;
}

export const InventoryService = {
  /**
   * Applies one stock movement: writes the ledger entry and adjusts the
   * cached quantityOnHand atomically inside a transaction, so a crash
   * between the two writes can never leave them out of sync. Requires a
   * replica-set MongoDB deployment (Atlas is one by default).
   */
  async applyMovement(input: StockMovementInput): Promise<void> {
    await connectToDatabase();
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const item = await InventoryItemModel.findOne({
          _id: input.inventoryItemId,
          organizationId: input.organizationId,
          branchId: input.branchId,
        }).session(session);

        if (!item) throw new BusinessRuleError("Inventory item not found for this branch.");

        const resultingQuantity = item.quantityOnHand + input.quantity;
        if (resultingQuantity < 0) {
          throw new BusinessRuleError(
            `Insufficient stock for "${item.name}" (have ${item.quantityOnHand}${item.unit}, need ${-input.quantity}${item.unit}).`
          );
        }

        await StockMovementModel.create(
          [
            {
              organizationId: input.organizationId,
              branchId: input.branchId,
              inventoryItemId: input.inventoryItemId,
              type: input.type,
              quantity: input.quantity,
              unitCostMinor: input.unitCostMinor,
              reference: input.reference,
              note: input.note,
              performedBy: input.performedBy,
            },
          ],
          { session }
        );

        const update: Record<string, unknown> = { $inc: { quantityOnHand: input.quantity } };
        if (input.type === "PURCHASE" && input.unitCostMinor) {
          // simple moving average: new_avg = (old_avg*old_qty + cost*qty_in) / new_qty
          const newAvg =
            resultingQuantity === 0
              ? item.averageUnitCostMinor
              : (item.averageUnitCostMinor * item.quantityOnHand + input.unitCostMinor * input.quantity) /
                resultingQuantity;
          update.averageUnitCostMinor = newAvg;
        }

        await InventoryItemModel.updateOne(
          { _id: input.inventoryItemId },
          input.type === "PURCHASE" && input.unitCostMinor
            ? { $inc: { quantityOnHand: input.quantity }, $set: { averageUnitCostMinor: update.averageUnitCostMinor } }
            : update,
          { session }
        );

        if (resultingQuantity <= item.reorderLevel) {
          await publishEvent(
            REALTIME_EVENTS.INVENTORY_LOW,
            branchChannel(input.branchId, "ops"),
            input.organizationId,
            input.branchId,
            { inventoryItemId: input.inventoryItemId, name: item.name, quantityOnHand: resultingQuantity }
          );
        }
      });
    } finally {
      await session.endSession();
    }
  },

  /** Convenience wrapper used by OrderService when an order starts preparing. */
  async consumeForOrderItem(params: {
    organizationId: string;
    branchId: string;
    orderId: string;
    inventoryItemId: string;
    quantity: number;
    performedBy: string;
  }): Promise<void> {
    await this.applyMovement({
      organizationId: params.organizationId,
      branchId: params.branchId,
      inventoryItemId: params.inventoryItemId,
      type: "SALE_CONSUMPTION",
      quantity: -Math.abs(params.quantity),
      reference: { kind: "ORDER", id: params.orderId },
      performedBy: params.performedBy,
    });
  },

  async listForBranch(ctx: AuthContext, branchId: string) {
    requirePermissions(ctx, PERMISSIONS.INVENTORY_VIEW);
    requireBranchAccess(ctx, branchId);
    await connectToDatabase();
    return InventoryItemModel.find({ organizationId: ctx.organizationId, branchId }).sort({ name: 1 }).lean();
  },

  async createItem(
    ctx: AuthContext,
    input: { branchId: string; name: string; unit: string; minimumStock: number; reorderLevel: number }
  ) {
    requirePermissions(ctx, PERMISSIONS.INVENTORY_ADJUST);
    requireBranchAccess(ctx, input.branchId);
    await connectToDatabase();
    return InventoryItemModel.create({
      organizationId: ctx.organizationId,
      branchId: input.branchId,
      name: input.name,
      unit: input.unit,
      minimumStock: input.minimumStock,
      reorderLevel: input.reorderLevel,
    });
  },

  /** User-initiated adjustment/waste/receiving entry — goes through the same ledger as system-triggered consumption. */
  async recordManualMovement(
    ctx: AuthContext,
    input: { branchId: string; inventoryItemId: string; type: StockMovementType; quantity: number; unitCostMinor?: number; note?: string }
  ): Promise<void> {
    requirePermissions(ctx, PERMISSIONS.INVENTORY_ADJUST);
    requireBranchAccess(ctx, input.branchId);
    await this.applyMovement({
      organizationId: ctx.organizationId,
      branchId: input.branchId,
      inventoryItemId: input.inventoryItemId,
      type: input.type,
      quantity: input.quantity,
      unitCostMinor: input.unitCostMinor,
      reference: { kind: "MANUAL" },
      note: input.note,
      performedBy: ctx.userId,
    });
  },
};
