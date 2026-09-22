import "server-only";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/models/User";
import { RoleModel } from "@/models/Role";
import { OrganizationModel } from "@/models/Organization";
import { AuthenticationError, AuthorizationError, NotFoundError } from "@/lib/errors";
import type { Permission } from "@/types/permissions";
import type { SessionPayload } from "@/lib/auth";
import { isOrganizationWideRole } from "@/lib/portal-access";
import { synchronizeSystemRoles } from "@/services/role.service";

export interface AuthContext {
  userId: string;
  organizationId: string;
  roleSlug: string;
  activeBranchId: string | null;
  permissions: Permission[];
  assignedBranchIds: string[];
}

/**
 * Loads the acting user's *current* permission set from the database.
 * Permissions are intentionally never trusted from the session token or
 * from any client-supplied field — a role change or deactivation takes
 * effect on the very next request.
 */
export async function loadAuthContext(session: SessionPayload): Promise<AuthContext> {
  await connectToDatabase();

  const org = await OrganizationModel.findOne({ _id: session.organizationId, isActive: true }).lean();
  if (!org) throw new AuthenticationError("This organization's account is currently suspended.");

  // System roles evolve as the product gains secure operating portals. Add
  // missing built-ins safely before evaluating the live role below.
  await synchronizeSystemRoles(String(org._id));

  const user = await UserModel.findOne({
    _id: session.userId,
    organizationId: session.organizationId,
    isActive: true,
  }).lean();

  if (!user) throw new AuthenticationError("Your session is no longer valid.");

  const role = await RoleModel.findOne({
    _id: user.roleId,
    organizationId: session.organizationId,
  }).lean();

  if (!role) throw new NotFoundError("Role");

  return {
    userId: String(user._id),
    organizationId: String(user.organizationId),
    roleSlug: role.slug,
    activeBranchId: session.activeBranchId,
    permissions: role.permissions as Permission[],
    assignedBranchIds: (user.assignedBranchIds ?? []).map(String),
  };
}

/** Throws AuthorizationError unless every listed permission is present. */
export function requirePermissions(ctx: AuthContext, ...required: Permission[]): void {
  const missing = required.filter((p) => !ctx.permissions.includes(p));
  if (missing.length > 0) {
    throw new AuthorizationError(`Missing permission(s): ${missing.join(", ")}`);
  }
}

/**
 * True for a user whose role carries permissions but isn't restricted to
 * specific branches (an org-wide operator — typically the owner or a
 * head-office role). Everyone else must be explicitly assigned via
 * assignedBranchIds.
 */
export function isOrgWideAccess(ctx: AuthContext): boolean {
  return isOrganizationWideRole(ctx.roleSlug) && ctx.assignedBranchIds.length === 0;
}

/** Throws unless the acting user has org-wide access or is assigned to the given branch. */
export function requireBranchAccess(ctx: AuthContext, branchId: string): void {
  if (isOrgWideAccess(ctx)) return;
  if (!ctx.assignedBranchIds.includes(branchId)) {
    throw new AuthorizationError("You don't have access to this branch.");
  }
}
