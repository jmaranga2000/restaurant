import "server-only";
import { BranchRepository } from "@/repositories/branch.repository";
import { AuditService } from "@/services/audit.service";
import { requirePermissions, type AuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import type { CreateBranchInput, UpdateBranchInput } from "@/validations/branch.schema";

export const BranchService = {
  async list(ctx: AuthContext) {
    requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
    return BranchRepository.listByOrganization(ctx.organizationId);
  },

  async create(ctx: AuthContext, input: CreateBranchInput) {
    requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);

    if (await BranchRepository.codeExists(ctx.organizationId, input.code)) {
      throw new BusinessRuleError(`Branch code "${input.code}" is already in use.`);
    }

    const branch = await BranchRepository.create({
      organizationId: ctx.organizationId,
      name: input.name,
      code: input.code,
      address: input.address,
      timezone: input.timezone,
      createdBy: ctx.userId,
    });

    await AuditService.record({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      action: "branch.created",
      entityType: "Branch",
      entityId: String(branch._id),
      after: { name: branch.name, code: branch.code },
    });

    return branch;
  },

  async update(ctx: AuthContext, input: UpdateBranchInput) {
    requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);

    const branch = await BranchRepository.findById(ctx.organizationId, input.branchId);
    if (!branch) throw new NotFoundError("Branch");

    const before = { name: branch.name, code: branch.code, isActive: branch.isActive };

    if (input.name !== undefined) branch.name = input.name;
    if (input.address !== undefined) branch.address = input.address;
    if (input.timezone !== undefined) branch.timezone = input.timezone;
    if (input.isActive !== undefined) branch.isActive = input.isActive;
    branch.updatedBy = ctx.userId as unknown as typeof branch.updatedBy;
    await branch.save();

    await AuditService.record({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      action: "branch.updated",
      entityType: "Branch",
      entityId: String(branch._id),
      before,
      after: { name: branch.name, code: branch.code, isActive: branch.isActive },
    });

    return branch;
  },
};
