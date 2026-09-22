import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { DashboardService } from "@/services/dashboard.service";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chart } from "@/components/ui/Chart";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";

function formatMoney(minorUnits: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(minorUnits / 100);
}

export default async function DashboardPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS);
  const canUsePos = ctx.permissions.includes(PERMISSIONS.POS_ACCESS);
  const canUseKitchen = ctx.permissions.includes(PERMISSIONS.KITCHEN_ACCESS);
  const canViewInventory = ctx.permissions.includes(PERMISSIONS.INVENTORY_VIEW);
  const canViewReports = ctx.permissions.includes(PERMISSIONS.REPORTS_VIEW);

  if (!ctx.activeBranchId) {
    return (
      <div className="mx-auto max-w-7xl p-4 sm:p-8">
        <PageHeading eyebrow="Restaurant workspace" title="Your dashboard" description="Choose a location to see its live service performance." />
        <div className="mt-6">
          <EmptyState
            icon="⌂"
            title="Choose a branch to get started"
            description="Your dashboard becomes a live service overview once a branch is selected."
            action={<Button href="/admin/branches">Manage branches</Button>}
          />
        </div>
      </div>
    );
  }

  const summary = await DashboardService.todaySummary(ctx.organizationId, ctx.activeBranchId);
  const activeOrders = summary.pending + summary.preparing + summary.ready;
  const queueValues = [summary.pending, summary.preparing, summary.ready, summary.ordersToday];

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeading
        eyebrow="Restaurant workspace"
        title="Today’s service"
        description="A clear view of orders, revenue, and what your team needs to do next."
        actions={<>{canUsePos ? <Button href="/pos">Open POS <span aria-hidden="true">→</span></Button> : null}{canUseKitchen ? <Button href="/kitchen" variant="secondary">Kitchen board</Button> : null}</>}
      />

      <Card className="mt-6 overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white dark:border-indigo-400/25 dark:from-[#155C88] dark:to-[#082C46] sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge tone="info" className="bg-white/15 text-white">Live service overview</Badge>
            <h2 className="mt-3 font-display text-2xl">{activeOrders > 0 ? `${activeOrders} orders need attention` : "Your floor is ready for service"}</h2>
            <p className="mt-2 text-sm text-white/75">{activeOrders > 0 ? "Use the kitchen board to keep every handoff moving." : "Open the POS whenever your next guest is ready to order."}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-56">
            <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3"><p className="text-xs text-white/60">Active queue</p><p className="mt-1 font-display text-2xl">{activeOrders}</p></div>
            <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3"><p className="text-xs text-white/60">Completed</p><p className="mt-1 font-display text-2xl">{summary.ordersToday}</p></div>
          </div>
        </div>
      </Card>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Today’s key figures">
        <MetricCard label="Completed orders" value={String(summary.ordersToday)} icon="✓" hint="Orders completed today" />
        <MetricCard label="Revenue" value={formatMoney(summary.revenueTodayMinor)} icon="↗" trend={summary.revenueTodayMinor > 0 ? "Sales recorded today" : undefined} hint="Completed order revenue" />
        <MetricCard label="Average order" value={formatMoney(summary.averageOrderValueMinor)} icon="◎" hint="Average completed order value" />
      </section>

      <section className="mt-3 grid gap-3 sm:grid-cols-3" aria-label="Order queue status">
        <MetricCard label="Waiting" value={String(summary.pending)} icon="◷" hint="Placed or confirmed" />
        <MetricCard label="In kitchen" value={String(summary.preparing)} icon="⌁" hint="Currently being prepared" />
        <MetricCard label="Ready to serve" value={String(summary.ready)} icon="●" hint="Waiting for pickup or service" />
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-5">
        <Card className="p-5 lg:col-span-3">
          <div className="flex items-start justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Order flow</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Service activity</h2></div>
            <Badge tone={activeOrders > 0 ? "warning" : "success"}>{activeOrders > 0 ? "Live queue" : "All clear"}</Badge>
          </div>
          <div className="mt-6 h-48 text-ink dark:text-paper"><Chart values={queueValues} label="Current order-flow activity" /></div>
          <div className="mt-3 grid grid-cols-4 text-center text-xs text-ink/55 dark:text-paper/55"><span>Waiting</span><span>Cooking</span><span>Ready</span><span>Done</span></div>
        </Card>
        <Card className="p-5 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Service queue</p>
          <h2 className="mt-1 font-display text-xl text-ink dark:text-paper">What needs attention</h2>
          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-3 dark:bg-amber-400/10"><span className="text-sm text-ink dark:text-paper">Awaiting preparation</span><Badge tone="warning">{summary.pending}</Badge></div>
            <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-3 dark:bg-indigo-400/10"><span className="text-sm text-ink dark:text-paper">In the kitchen</span><Badge tone="info">{summary.preparing}</Badge></div>
            <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-3 dark:bg-emerald-400/10"><span className="text-sm text-ink dark:text-paper">Ready to serve</span><Badge tone="success">{summary.ready}</Badge></div>
          </div>
          <Button href="/kitchen" variant="ghost" size="sm" className="mt-5 px-0">View kitchen board <span aria-hidden="true">→</span></Button>
        </Card>
      </section>

      <Card className="mt-4 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Quick actions</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Keep the shift moving</h2></div><div className="flex flex-wrap gap-2">{canUsePos ? <Button href="/pos" variant="secondary" size="sm">New order</Button> : null}{canViewInventory ? <Button href="/inventory" variant="secondary" size="sm">Check inventory</Button> : null}{canViewReports ? <Button href="/reports" variant="secondary" size="sm">View reports</Button> : null}</div></div>
      </Card>
    </div>
  );
}
