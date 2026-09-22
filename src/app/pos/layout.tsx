import { CashierShell } from "@/components/cashier/CashierShell";
import { requireSession } from "@/lib/session";
import { BranchModel } from "@/models/Branch";
import { loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.POS_ACCESS);
  if (ctx.activeBranchId) requireBranchAccess(ctx, ctx.activeBranchId);
  const branch = ctx.activeBranchId
    ? await BranchModel.findOne({ _id: ctx.activeBranchId, organizationId: ctx.organizationId }).select("name").lean()
    : null;

  return <CashierShell branchName={branch?.name ?? "Select an assigned branch"}>{children}</CashierShell>;
}
