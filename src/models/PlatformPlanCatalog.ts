import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { SUBSCRIPTION_PLAN_CODES } from "@/lib/subscriptions";

const planSchema = new Schema(
  {
    code: { type: String, enum: SUBSCRIPTION_PLAN_CODES, required: true },
    label: { type: String, required: true, trim: true, maxlength: 60 },
    monthlyMinor: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    features: [{ type: String, required: true, trim: true, maxlength: 120 }],
  },
  { _id: false }
);

const platformPlanCatalogSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "default" },
    plans: { type: [planSchema], required: true },
  },
  { timestamps: true }
);

export type PlatformPlanCatalog = InferSchemaType<typeof platformPlanCatalogSchema>;
export const PlatformPlanCatalogModel: Model<PlatformPlanCatalog> = models.PlatformPlanCatalog || model<PlatformPlanCatalog>("PlatformPlanCatalog", platformPlanCatalogSchema);