import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { DashboardService } from "@/services/dashboard.service";
import { MetricCard } from "@/components/ui/MetricCard";

function formatMoney(minorUnits: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency }).format(minorUnits / 100);
}

export default async function DashboardPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);

  if (!ctx.activeBranchId) {
    return (
      <div className="p-8">
        <p className="text-ink/70">Select a branch to see its dashboard.</p>
      </div>
    );
  }

  const summary = await DashboardService.todaySummary(ctx.organizationId, ctx.activeBranchId);

  return (
    <div className="p-8">
      <h1 className="font-display text-2xl mb-6">Today</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Orders completed" value={String(summary.ordersToday)} />
        <MetricCard label="Revenue" value={formatMoney(summary.revenueTodayMinor)} />
        <MetricCard label="Average order value" value={formatMoney(summary.averageOrderValueMinor)} />
        <MetricCard label="Pending" value={String(summary.pending)} hint="Placed or confirmed, not yet in the kitchen" />
        <MetricCard label="Preparing" value={String(summary.preparing)} />
        <MetricCard label="Ready" value={String(summary.ready)} hint="Waiting for pickup / service" />
      </div>
    </div>
  );
}
