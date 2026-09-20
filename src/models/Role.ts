import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { ALL_PERMISSIONS } from "@/types/permissions";

const roleSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    name: { type: String, required: true, trim: true }, // "Owner", "Branch Manager", ...
    slug: { type: String, required: true, trim: true }, // "owner", "branch_manager", ...
    permissions: [{ type: String, enum: ALL_PERMISSIONS, required: true }],
    isSystemRole: { type: Boolean, default: false }, // seeded default, cannot be deleted
  },
  { timestamps: true }
);

roleSchema.index({ organizationId: 1, slug: 1 }, { unique: true });

export type Role = InferSchemaType<typeof roleSchema>;
export const RoleModel: Model<Role> = models.Role || model<Role>("Role", roleSchema);
