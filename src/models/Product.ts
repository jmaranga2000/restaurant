import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const categorySchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
categorySchema.index({ organizationId: 1, isActive: 1 });

export type Category = InferSchemaType<typeof categorySchema>;
export const CategoryModel: Model<Category> = models.Category || model<Category>("Category", categorySchema);

const modifierSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    priceMinor: { type: Number, required: true, default: 0 },
  },
  { _id: true }
);

const modifierGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // "Add-ons", "Spice level"
    minSelect: { type: Number, default: 0 },
    maxSelect: { type: Number, default: 1 },
    options: [modifierSchema],
  },
  { _id: true }
);

const variantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true }, // "Regular" / "Large" / "Double"
    priceMinor: { type: Number, required: true }, // base price in minor currency units
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const recipeLineSchema = new Schema(
  {
    inventoryItemId: { type: Schema.Types.ObjectId, ref: "InventoryItem", required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, required: true }, // "g", "ml", "unit" — must match the ingredient's stock unit
  },
  { _id: false }
);

/**
 * Product is defined at the organization level (the shared catalog).
 * Branch-specific price overrides and availability live in
 * BranchProductOverride (not modeled in this scaffold slice) so the same
 * "Chicken Burger" can cost more at one branch without duplicating the
 * product itself.
 */
const productSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    imagePublicId: { type: String }, // Cloudinary public_id, not a raw URL
    variants: { type: [variantSchema], default: [] },
    modifierGroups: { type: [modifierGroupSchema], default: [] },
    recipe: { type: [recipeLineSchema], default: [] },
    kitchenStation: { type: String }, // e.g. "grill", "cold-station", "bar"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);
productSchema.index({ organizationId: 1, categoryId: 1, isActive: 1 });
productSchema.index({ organizationId: 1, name: "text" });

export type Product = InferSchemaType<typeof productSchema>;
export const ProductModel: Model<Product> = models.Product || model<Product>("Product", productSchema);
