import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const customerSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    notes: { type: String, trim: true },
    loyaltyPoints: { type: Number, default: 0 },
    tags: [{ type: String, trim: true }], // segmentation, e.g. "regular", "corporate"
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

customerSchema.index({ organizationId: 1, phone: 1 }, { sparse: true });
customerSchema.index({ organizationId: 1, email: 1 }, { sparse: true });
customerSchema.index({ organizationId: 1, name: "text" });

export type Customer = InferSchemaType<typeof customerSchema>;
export const CustomerModel: Model<Customer> = models.Customer || model<Customer>("Customer", customerSchema);
