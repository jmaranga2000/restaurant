import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const branchSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true }, // short branch code, e.g. "NBO-01"
    address: { type: String, trim: true },
    timezone: { type: String },
    openingHours: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6, required: true },
        opensAt: { type: String, required: true }, // "09:00"
        closesAt: { type: String, required: true }, // "22:00"
      },
    ],
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

branchSchema.index({ organizationId: 1, code: 1 }, { unique: true });
branchSchema.index({ organizationId: 1, isActive: 1 });

export type Branch = InferSchemaType<typeof branchSchema>;
export const BranchModel: Model<Branch> = models.Branch || model<Branch>("Branch", branchSchema);
