import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const loyaltyRewardSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 240 },
    pointsRequired: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

loyaltyRewardSchema.index({ organizationId: 1, isActive: 1, pointsRequired: 1 });

export type LoyaltyReward = InferSchemaType<typeof loyaltyRewardSchema>;
export const LoyaltyRewardModel: Model<LoyaltyReward> = models.LoyaltyReward || model<LoyaltyReward>("LoyaltyReward", loyaltyRewardSchema);