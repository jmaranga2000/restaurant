import { KitchenShell } from "@/components/kitchen/KitchenShell";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { BranchModel } from "@/models/Branch";
import { OrganizationModel } from "@/models/Organization";

export default async function KitchenLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.KITCHEN_ACCESS);
  if (ctx.activeBranchId) requireBranchAccess(ctx, ctx.activeBranchId);
  const [branch, organization] = await Promise.all([
    ctx.activeBranchId ? BranchModel.findById(ctx.activeBranchId).select("name").lean() : null,
    OrganizationModel.findById(ctx.organizationId).select("settings.kitchenStations").lean(),
  ]);
  const stations = organization?.settings?.kitchenStations?.filter(Boolean) ?? ["Kitchen"];
  return <KitchenShell branchName={branch?.name ?? "Choose a branch"} stations={stations} canConfigure={ctx.permissions.includes(PERMISSIONS.RESTAURANT_ADMIN_ACCESS)}>{children}</KitchenShell>;
}
