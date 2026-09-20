import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const cashierSessionSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    cashierId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    openingFloatMinor: { type: Number, required: true, default: 0 },
    closingCountMinor: { type: Number }, // physically counted cash at close
    expectedCashMinor: { type: Number }, // openingFloat + cash sales - cash refunds, computed at close
    varianceMinor: { type: Number }, // closingCount - expectedCash; flagged for review if non-zero
    status: { type: String, enum: ["OPEN", "CLOSED"], required: true, default: "OPEN" },
    openedAt: { type: Date, required: true, default: Date.now },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

cashierSessionSchema.index({ organizationId: 1, branchId: 1, status: 1 });
cashierSessionSchema.index({ organizationId: 1, cashierId: 1, openedAt: -1 });
// A cashier can only have one OPEN session per branch at a time.
cashierSessionSchema.index(
  { branchId: 1, cashierId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "OPEN" } }
);

export type CashierSession = InferSchemaType<typeof cashierSessionSchema>;
export const CashierSessionModel: Model<CashierSession> = models.CashierSession || model<CashierSession>("CashierSession", cashierSessionSchema);
