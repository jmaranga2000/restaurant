import { requireSession } from "@/lib/session";
import { loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { DashboardService } from "@/services/dashboard.service";

function formatMoney(minorUnits: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(minorUnits / 100);
}

function toInputDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS, PERMISSIONS.REPORTS_VIEW);
  if (ctx.activeBranchId) requireBranchAccess(ctx, ctx.activeBranchId);

  if (!ctx.activeBranchId) {
    return <div className="p-8 text-ink/70">Select a branch to see its reports.</div>;
  }

  const today = new Date();
  const defaultFrom = new Date(today);
  defaultFrom.setDate(defaultFrom.getDate() - 6);

  const from = searchParams.from ? new Date(searchParams.from) : defaultFrom;
  const to = searchParams.to ? new Date(searchParams.to) : today;
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  const summary = await DashboardService.rangeSummary(ctx.organizationId, ctx.activeBranchId, from, to);

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-display text-2xl mb-6">Sales report</h1>

      <form className="flex items-end gap-3 mb-8">
        <div>
          <label className="block text-xs text-ink/50 mb-1">From</label>
          <input type="date" name="from" defaultValue={toInputDate(from)} className="border border-ink-line/30 rounded px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-ink/50 mb-1">To</label>
          <input type="date" name="to" defaultValue={toInputDate(to)} className="border border-ink-line/30 rounded px-3 py-2 text-sm" />
        </div>
        <button type="submit" className="bg-ink text-white rounded px-4 py-2 text-sm">
          Apply
        </button>
      </form>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-ink-line/20 rounded-lg p-4 bg-white">
          <p className="text-sm text-ink/60">Completed orders</p>
          <p className="font-display text-3xl mt-1 tabular-nums">{summary.ordersCompleted}</p>
        </div>
        <div className="border border-ink-line/20 rounded-lg p-4 bg-white">
          <p className="text-sm text-ink/60">Revenue</p>
          <p className="font-display text-3xl mt-1 tabular-nums">{formatMoney(summary.revenueMinor)}</p>
        </div>
        <div className="border border-ink-line/20 rounded-lg p-4 bg-white">
          <p className="text-sm text-ink/60">Cancelled orders</p>
          <p className="font-display text-3xl mt-1 tabular-nums">{summary.cancelledCount}</p>
        </div>
      </div>

      <h2 className="font-display text-lg mb-3">Top products</h2>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-ink/50 border-b border-ink-line/20">
            <th className="py-2 font-normal">Product</th>
            <th className="py-2 font-normal">Qty sold</th>
            <th className="py-2 font-normal">Revenue</th>
          </tr>
        </thead>
        <tbody>
          {summary.topProducts.map((p) => (
            <tr key={p.name} className="border-b border-ink-line/10">
              <td className="py-2">{p.name}</td>
              <td className="py-2 tabular-nums">{p.quantitySold}</td>
              <td className="py-2 tabular-nums">{formatMoney(p.revenueMinor)}</td>
            </tr>
          ))}
          {summary.topProducts.length === 0 && (
            <tr>
              <td colSpan={3} className="py-6 text-center text-ink/40">
                No completed orders in this range.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
