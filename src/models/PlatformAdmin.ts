import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

/**
 * Platform admins operate the SaaS itself (onboarding/suspending
 * organizations, billing, support) and are structurally separate from
 * tenant Users — there is no organizationId here, no roleId pointing at a
 * tenant Role, and this model is never joined against tenant data in a way
 * that would let a platform admin session double as a tenant session.
 * See src/lib/platform-auth.ts for the separate session mechanism.
 */
const platformAdminSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

export type PlatformAdmin = InferSchemaType<typeof platformAdminSchema>;
export const PlatformAdminModel: Model<PlatformAdmin> = models.PlatformAdmin || model<PlatformAdmin>("PlatformAdmin", platformAdminSchema);
