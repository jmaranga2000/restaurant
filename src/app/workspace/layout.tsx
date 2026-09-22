import { redirect } from "next/navigation";
import { RestaurantWorkspaceShell } from "@/components/workspace/RestaurantWorkspaceShell";
import { requireSession } from "@/lib/session";
import { BranchRepository } from "@/repositories/branch.repository";
import { isOrgWideAccess, loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { OrganizationModel } from "@/models/Organization";
import { connectToDatabase } from "@/lib/db";
import { groupedWorkspaceModules, normalizeSubscriptionPlan } from "@/lib/workspace";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS);
  if (ctx.activeBranchId) requireBranchAccess(ctx, ctx.activeBranchId);
  await connectToDatabase();
  const organization = await OrganizationModel.findById(ctx.organizationId).lean();
  if (!organization) redirect("/login");
  if (organization.onboarding?.status === "IN_PROGRESS") redirect("/onboarding");

  const organizationWide = isOrgWideAccess(ctx);
  const branchDocs = organizationWide ? await BranchRepository.listByOrganization(ctx.organizationId) : await BranchRepository.findManyByIds(ctx.organizationId, ctx.assignedBranchIds);
  const plan = normalizeSubscriptionPlan(organization.subscription?.plan);
  const navigation = groupedWorkspaceModules(ctx.permissions, plan, organization.subscription?.enabledModules);

  return <RestaurantWorkspaceShell organizationName={organization.name} logoUrl={organization.logoUrl ?? undefined} branches={branchDocs.map((branch) => ({ id: String(branch._id), name: branch.name }))} activeBranchId={ctx.activeBranchId} allowAllBranches={organizationWide} navigation={navigation} plan={plan} canConfigureOrganization={ctx.permissions.includes(PERMISSIONS.RESTAURANT_ADMIN_ACCESS)}>{children}</RestaurantWorkspaceShell>;
}
