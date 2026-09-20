import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { DashboardService } from "@/services/dashboard.service";

function formatMoney(minorUnits: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(minorUnits / 100);
}

export default async function AdminOverviewPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  const rows = await DashboardService.orgWideSummaryByBranch(ctx.organizationId);

  const totalRevenue = rows.reduce((sum, r) => sum + r.revenueTodayMinor, 0);
  const totalOrders = rows.reduce((sum, r) => sum + r.ordersToday, 0);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl mb-1">Today, across all branches</h1>
      <p className="text-ink/50 text-sm mb-6">
        {totalOrders} completed orders · {formatMoney(totalRevenue)}
      </p>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-left text-ink/50 border-b border-ink-line/20">
            <th className="py-2 font-normal">Branch</th>
            <th className="py-2 font-normal">Orders today</th>
            <th className="py-2 font-normal">Revenue today</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.branchId} className="border-b border-ink-line/10">
              <td className="py-3">
                {r.branchName} <span className="text-ink/40">({r.branchCode})</span>
              </td>
              <td className="py-3 tabular-nums">{r.ordersToday}</td>
              <td className="py-3 tabular-nums">{formatMoney(r.revenueTodayMinor)}</td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="py-8 text-center text-ink/40">
                No active branches yet — add one under Branches.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
