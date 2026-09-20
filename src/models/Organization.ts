import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const organizationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    defaultCurrency: { type: String, required: true, default: "KES" },
    defaultTimezone: { type: String, required: true, default: "Africa/Nairobi" },
    settings: {
      taxRatePercent: { type: Number, default: 0 },
      serviceChargePercent: { type: Number, default: 0 },
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export type Organization = InferSchemaType<typeof organizationSchema>;
export const OrganizationModel: Model<Organization> = models.Organization || model<Organization>("Organization", organizationSchema);
