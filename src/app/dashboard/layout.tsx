import { RestaurantPortalShell } from "@/components/layout/RestaurantPortalShell";
import { requireSession } from "@/lib/session";
import { isOrgWideAccess, loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { BranchRepository } from "@/repositories/branch.repository";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS);
  if (ctx.activeBranchId) requireBranchAccess(ctx, ctx.activeBranchId);
  const organizationWide = isOrgWideAccess(ctx);
  const branches = organizationWide
    ? (await BranchRepository.listByOrganization(ctx.organizationId)).map((branch) => ({ id: String(branch._id), name: branch.name }))
    : (await BranchRepository.findManyByIds(ctx.organizationId, ctx.assignedBranchIds)).map((branch) => ({ id: String(branch._id), name: branch.name }));

  const canManageOrganization = ctx.permissions.includes(PERMISSIONS.RESTAURANT_ADMIN_ACCESS);
  const navigation = [
    { href: "/dashboard", label: "Dashboard", icon: "▥" },
    ...(ctx.permissions.includes(PERMISSIONS.POS_ACCESS) ? [{ href: "/pos", label: "POS", icon: "⊞" }] : []),
    ...(ctx.permissions.includes(PERMISSIONS.KITCHEN_ACCESS) ? [{ href: "/kitchen", label: "Kitchen", icon: "♨" }] : []),
    ...(ctx.permissions.includes(PERMISSIONS.INVENTORY_VIEW) ? [{ href: "/inventory", label: "Inventory", icon: "▤" }] : []),
    ...(ctx.permissions.includes(PERMISSIONS.REPORTS_VIEW) ? [{ href: "/reports", label: "Reports", icon: "↗" }] : []),
  ];

  return (
    <RestaurantPortalShell
      navigation={navigation}
      title="Restaurant OS"
      subtitle="Branch workspace"
      homeHref="/dashboard"
      branches={branches}
      activeBranchId={ctx.activeBranchId}
      allowAllBranches={organizationWide}
      footerLink={canManageOrganization ? { href: "/admin", label: "Restaurant administration →" } : undefined}
      headerLink={{ href: "/workspace", label: "Manager workspace" }}
    >
      {children}
    </RestaurantPortalShell>
  );
}
