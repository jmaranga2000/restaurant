import "server-only";
import { UserRepository } from "@/repositories/user.repository";
import { RoleModel } from "@/models/Role";
import { connectToDatabase } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { AuditService } from "@/services/audit.service";
import { requirePermissions, type AuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { BusinessRuleError, NotFoundError } from "@/lib/errors";
import type { InviteUserInput, UpdateUserInput } from "@/validations/user.schema";

export const UserService = {
  async list(ctx: AuthContext) {
    requirePermissions(ctx, PERMISSIONS.USERS_VIEW);
    return UserRepository.listByOrganization(ctx.organizationId);
  },

  async listRoles(ctx: AuthContext) {
    requirePermissions(ctx, PERMISSIONS.USERS_VIEW);
    await connectToDatabase();
    return RoleModel.find({ organizationId: ctx.organizationId }).sort({ name: 1 }).lean();
  },

  async invite(ctx: AuthContext, input: InviteUserInput) {
    requirePermissions(ctx, PERMISSIONS.USERS_CREATE);

    if (await UserRepository.emailExists(ctx.organizationId, input.email)) {
      throw new BusinessRuleError(`A user with email "${input.email}" already exists in this organization.`);
    }

    await connectToDatabase();
    const role = await RoleModel.findOne({ _id: input.roleId, organizationId: ctx.organizationId }).lean();
    if (!role) throw new NotFoundError("Role");

    const passwordHash = await hashPassword(input.temporaryPassword);
    const user = await UserRepository.create({
      organizationId: ctx.organizationId,
      name: input.name,
      email: input.email,
      passwordHash,
      roleId: input.roleId,
      assignedBranchIds: input.assignedBranchIds,
    });

    await AuditService.record({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      action: "user.invited",
      entityType: "User",
      entityId: String(user._id),
      after: { email: user.email, roleId: input.roleId, assignedBranchIds: input.assignedBranchIds },
    });

    // NOTE: a real build sends the temporary password via EmailService
    // (Resend) here rather than displaying it — see README > "not yet
    // written" services.
    return user;
  },

  async update(ctx: AuthContext, input: UpdateUserInput) {
    requirePermissions(ctx, PERMISSIONS.USERS_UPDATE);

    const user = await UserRepository.findById(ctx.organizationId, input.userId);
    if (!user) throw new NotFoundError("User");

    const before = { roleId: String(user.roleId), assignedBranchIds: user.assignedBranchIds.map(String), isActive: user.isActive };

    if (input.name !== undefined) user.name = input.name;
    if (input.roleId !== undefined) user.roleId = input.roleId as unknown as typeof user.roleId;
    if (input.assignedBranchIds !== undefined)
      user.assignedBranchIds = input.assignedBranchIds as unknown as typeof user.assignedBranchIds;
    if (input.isActive !== undefined) user.isActive = input.isActive;
    await user.save();

    await AuditService.record({
      organizationId: ctx.organizationId,
      actorId: ctx.userId,
      action: "user.updated",
      entityType: "User",
      entityId: String(user._id),
      before,
      after: { roleId: String(user.roleId), assignedBranchIds: user.assignedBranchIds.map(String), isActive: user.isActive },
    });

    return user;
  },
};
