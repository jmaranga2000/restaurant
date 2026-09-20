import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const auditLogSchema = new Schema(
  {
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch" },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true }, // "order.status_changed", "product.price_updated", ...
    entityType: { type: String, required: true }, // "Order", "Product", ...
    entityId: { type: Schema.Types.ObjectId, required: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true, capped: undefined }
);

// No updatedAt-driven mutation path is exposed anywhere in the app — audit
// logs are written once by AuditService.record() and never modified.
auditLogSchema.index({ organizationId: 1, entityType: 1, entityId: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, branchId: 1, createdAt: -1 });
auditLogSchema.index({ organizationId: 1, actorId: 1, createdAt: -1 });

export type AuditLog = InferSchemaType<typeof auditLogSchema>;
export const AuditLogModel: Model<AuditLog> = models.AuditLog || model<AuditLog>("AuditLog", auditLogSchema);
