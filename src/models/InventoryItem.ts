import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const inventoryItemSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    name: { type: String, required: true, trim: true }, // "Chicken breast"
    unit: { type: String, required: true }, // "g", "ml", "unit"
    quantityOnHand: { type: Number, required: true, default: 0 }, // derived cache — see StockMovement
    minimumStock: { type: Number, default: 0 },
    reorderLevel: { type: Number, default: 0 },
    averageUnitCostMinor: { type: Number, default: 0 }, // moving average cost, updated on each PURCHASE movement
    supplierIds: [{ type: Schema.Types.ObjectId, ref: "Supplier" }],
  },
  { timestamps: true }
);

inventoryItemSchema.index({ organizationId: 1, branchId: 1, name: 1 }, { unique: true });
inventoryItemSchema.index({ organizationId: 1, branchId: 1, quantityOnHand: 1 });

export type InventoryItem = InferSchemaType<typeof inventoryItemSchema>;
export const InventoryItemModel: Model<InventoryItem> = models.InventoryItem || model<InventoryItem>("InventoryItem", inventoryItemSchema);
