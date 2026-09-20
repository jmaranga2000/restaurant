import { RestaurantPortalShell } from "@/components/layout/RestaurantPortalShell";
import { requireSession } from "@/lib/session";
import { isOrgWideAccess, loadAuthContext } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { BranchRepository } from "@/repositories/branch.repository";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: "▥" },
  { href: "/pos", label: "POS", icon: "⊞" },
  { href: "/kitchen", label: "Kitchen", icon: "♨" },
  { href: "/inventory", label: "Inventory", icon: "▤" },
  { href: "/reports", label: "Reports", icon: "↗" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  const organizationWide = isOrgWideAccess(ctx);
  const branches = organizationWide
    ? (await BranchRepository.listByOrganization(ctx.organizationId)).map((branch) => ({ id: String(branch._id), name: branch.name }))
    : (await BranchRepository.findManyByIds(ctx.organizationId, ctx.assignedBranchIds)).map((branch) => ({ id: String(branch._id), name: branch.name }));

  const canManageOrganization = ctx.permissions.includes(PERMISSIONS.SETTINGS_MANAGE);

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
      headerLink={canManageOrganization ? { href: "/workspace", label: "Workspace" } : undefined}
    >
      {children}
    </RestaurantPortalShell>
  );
}
