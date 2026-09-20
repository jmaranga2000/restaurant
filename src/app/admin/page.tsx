import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chart } from "@/components/ui/Chart";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
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
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenueTodayMinor, 0);
  const totalOrders = rows.reduce((sum, row) => sum + row.ordersToday, 0);
  const averageRevenue = rows.length ? Math.round(totalRevenue / rows.length) : 0;

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeading eyebrow="Restaurant administration" title="Across your branches" description="Monitor today’s performance and keep every location prepared for service." actions={<Button href="/admin/branches" size="sm">Manage branches <span aria-hidden="true">→</span></Button>} />

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Organization performance">
        <MetricCard label="Active branches" value={String(rows.length)} icon="⌂" hint="Locations reporting today" />
        <MetricCard label="Completed orders" value={totalOrders.toLocaleString()} icon="✓" hint="Across all branches" />
        <MetricCard label="Today’s revenue" value={formatMoney(totalRevenue)} icon="↗" trend={totalRevenue > 0 ? "Revenue recorded today" : undefined} hint="Completed-order revenue" />
        <MetricCard label="Average per branch" value={formatMoney(averageRevenue)} icon="◎" hint="Revenue divided by active branches" />
      </section>

      {rows.length === 0 ? <div className="mt-6"><EmptyState icon="⌂" title="Add your first branch" description="Create a branch to start managing locations, staff access, and daily performance." action={<Button href="/admin/branches">Add a branch</Button>} /></div> : <>
        <section className="mt-6 grid gap-4 lg:grid-cols-5">
          <Card className="p-5 lg:col-span-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Branch comparison</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Order activity today</h2></div><Badge tone="info">{rows.length} branches</Badge></div><div className="mt-6 h-56 text-ink dark:text-paper"><Chart values={rows.map((row) => row.ordersToday)} label="Completed orders by branch" /></div><div className="mt-3 grid gap-2 text-xs text-ink/55 dark:text-paper/55" style={{ gridTemplateColumns: `repeat(${Math.min(rows.length, 5)}, minmax(0, 1fr))` }}>{rows.slice(0, 5).map((row) => <span key={row.branchId} className="truncate text-center">{row.branchCode}</span>)}</div></Card>
          <Card className="p-5 lg:col-span-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Management</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Next steps</h2><div className="mt-5 space-y-3"><div className="rounded-lg bg-indigo-50 p-3 text-sm text-ink dark:bg-indigo-400/10 dark:text-paper">Review staff access before the next shift.</div><div className="rounded-lg bg-amber-50 p-3 text-sm text-ink dark:bg-amber-400/10 dark:text-paper">Check inventory levels across each branch.</div></div><Button href="/admin/users" variant="ghost" size="sm" className="mt-4 px-0">Manage users and roles <span aria-hidden="true">→</span></Button></Card>
        </section>

        <Card className="mt-4 overflow-hidden"><div className="flex flex-col gap-3 border-b border-ink-line/15 p-5 dark:border-ink-line sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Locations</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Branch performance</h2></div><Button href="/admin/branches" variant="secondary" size="sm">View branches</Button></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/55 dark:border-ink-line dark:bg-ink dark:text-paper/55"><tr><th className="px-5 py-3 font-medium">Branch</th><th className="px-3 py-3 font-medium">Code</th><th className="px-3 py-3 font-medium">Orders today</th><th className="px-5 py-3 text-right font-medium">Revenue today</th></tr></thead><tbody>{rows.map((row) => <tr key={row.branchId} className="border-b border-ink-line/10 last:border-0 dark:border-ink-line"><td className="px-5 py-4 font-medium text-ink dark:text-paper">{row.branchName}</td><td className="px-3 py-4"><Badge tone="neutral">{row.branchCode}</Badge></td><td className="px-3 py-4 tabular-nums text-ink/70 dark:text-paper/75">{row.ordersToday}</td><td className="px-5 py-4 text-right font-medium tabular-nums text-ink dark:text-paper">{formatMoney(row.revenueTodayMinor)}</td></tr>)}</tbody></table></div></Card>
      </>}
    </div>
  );
}
