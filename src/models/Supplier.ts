import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const supplierSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    contactName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    paymentTerms: { type: String, trim: true }, // e.g. "Net 30"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

supplierSchema.index({ organizationId: 1, isActive: 1 });
supplierSchema.index({ organizationId: 1, name: "text" });

export type Supplier = InferSchemaType<typeof supplierSchema>;
export const SupplierModel: Model<Supplier> = models.Supplier || model<Supplier>("Supplier", supplierSchema);
