import "server-only";
import { randomUUID } from "crypto";
import { BranchModel } from "@/models/Branch";
import { requireBranchAccess, requirePermissions, isOrgWideAccess, type AuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { NotFoundError } from "@/lib/errors";

export const DisplayService = {
  /** Lists only the branch displays that the current manager can administer. */
  async list(ctx: AuthContext) {
    requirePermissions(ctx, PERMISSIONS.DISPLAY_MANAGE);
    const branchFilter = isOrgWideAccess(ctx) ? {} : { _id: { $in: ctx.assignedBranchIds } };
    const query = { organizationId: ctx.organizationId, isActive: true, ...branchFilter };
    const existing = await BranchModel.find(query).select("name code customerDisplayKey").sort({ name: 1 }).lean();
    const missing = existing.filter((branch) => !branch.customerDisplayKey);
    if (missing.length) {
      await BranchModel.bulkWrite(missing.map((branch) => ({
        updateOne: { filter: { _id: branch._id, customerDisplayKey: { $exists: false } }, update: { $set: { customerDisplayKey: randomUUID() } } },
      })));
    }
    return missing.length ? BranchModel.find(query).select("name code customerDisplayKey").sort({ name: 1 }).lean() : existing;
  },

  async rotateKey(ctx: AuthContext, branchId: string) {
    requirePermissions(ctx, PERMISSIONS.DISPLAY_MANAGE);
    requireBranchAccess(ctx, branchId);
    const branch = await BranchModel.findOne({ _id: branchId, organizationId: ctx.organizationId, isActive: true });
    if (!branch) throw new NotFoundError("Branch");
    branch.customerDisplayKey = randomUUID();
    await branch.save();
    return branch.customerDisplayKey;
  },
};
