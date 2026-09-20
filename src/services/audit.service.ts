import "server-only";
import { connectToDatabase } from "@/lib/db";
import { AuditLogModel } from "@/models/AuditLog";

export interface AuditRecordInput {
  organizationId: string;
  branchId?: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export const AuditService = {
  async record(input: AuditRecordInput): Promise<void> {
    await connectToDatabase();
    await AuditLogModel.create(input);
  },
};
