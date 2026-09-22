import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const loyaltyTransactionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    orderId: { type: Schema.Types.ObjectId, ref: "Order" },
    type: { type: String, enum: ["EARN", "REDEEM"], required: true },
    // Positive values earn points; negative values record a redemption. A
    // signed ledger keeps the customer's visible balance explainable.
    points: { type: Number, required: true },
    balanceAfter: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true, maxlength: 180 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

loyaltyTransactionSchema.index({ organizationId: 1, customerId: 1, createdAt: -1 });
loyaltyTransactionSchema.index({ organizationId: 1, branchId: 1, createdAt: -1 });
// Prevent a fully-paid ticket from being rewarded twice if a request is retried.
loyaltyTransactionSchema.index({ organizationId: 1, orderId: 1, type: 1 }, { unique: true, sparse: true });

export type LoyaltyTransaction = InferSchemaType<typeof loyaltyTransactionSchema>;
export const LoyaltyTransactionModel: Model<LoyaltyTransaction> = models.LoyaltyTransaction || model<LoyaltyTransaction>("LoyaltyTransaction", loyaltyTransactionSchema);
