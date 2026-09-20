import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const tableSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
    label: { type: String, required: true, trim: true }, // "T12"
    seats: { type: Number, default: 2 },
    status: {
      type: String,
      enum: ["AVAILABLE", "OCCUPIED", "RESERVED", "NEEDS_CLEANING"],
      default: "AVAILABLE",
    },
    qrCodePublicId: { type: String }, // Cloudinary-hosted QR image, generated via QrCodeService
  },
  { timestamps: true }
);

tableSchema.index({ organizationId: 1, branchId: 1, label: 1 }, { unique: true });
tableSchema.index({ organizationId: 1, branchId: 1, status: 1 });

export type Table = InferSchemaType<typeof tableSchema>;
export const TableModel: Model<Table> = models.Table || model<Table>("Table", tableSchema);
