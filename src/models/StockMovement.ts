import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const STOCK_MOVEMENT_TYPES = [
  "PURCHASE",
  "SALE_CONSUMPTION",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "ADJUSTMENT",
  "WASTE",
  "RETURN",
  "OPENING_BALANCE",
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

const stockMovementSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    inventoryItemId: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    type: { type: String, enum: STOCK_MOVEMENT_TYPES, required: true },
    quantity: { type: Number, required: true }, // signed: positive = stock in, negative = stock out
    unitCostMinor: { type: Number }, // set on PURCHASE; used to update moving average cost
    reference: {
      // links back to the order, purchase order, or transfer that caused this movement
      kind: { type: String, enum: ["ORDER", "PURCHASE_ORDER", "TRANSFER", "MANUAL"], required: true },
      id: { type: Schema.Types.ObjectId },
    },
    note: { type: String, trim: true },
    performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

stockMovementSchema.index({ organizationId: 1, branchId: 1, inventoryItemId: 1, createdAt: -1 });
stockMovementSchema.index({ organizationId: 1, branchId: 1, type: 1, createdAt: -1 });

export type StockMovement = InferSchemaType<typeof stockMovementSchema>;
export const StockMovementModel: Model<StockMovement> = models.StockMovement || model<StockMovement>("StockMovement", stockMovementSchema);
export { STOCK_MOVEMENT_TYPES };
