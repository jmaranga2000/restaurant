import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const subscriptionRequestSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    plan: { type: String, enum: ["STARTER", "PROFESSIONAL", "ENTERPRISE"], required: true },
    billingCycle: { type: String, enum: ["MONTHLY", "ANNUAL"], required: true },
    paymentMethod: { type: String, enum: ["MPESA", "CARD", "BANK"], required: true },
    billingEmail: { type: String, required: true, lowercase: true, trim: true },
    mpesaPhone: { type: String, trim: true },
    amountMinor: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: "KES" },
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED", "CANCELLED"], required: true, default: "PENDING" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

subscriptionRequestSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

export type SubscriptionRequest = InferSchemaType<typeof subscriptionRequestSchema>;
export const SubscriptionRequestModel: Model<SubscriptionRequest> = models.SubscriptionRequest || model<SubscriptionRequest>("SubscriptionRequest", subscriptionRequestSchema);
