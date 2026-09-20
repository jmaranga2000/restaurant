import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chart } from "@/components/ui/Chart";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { requirePlatformSession } from "@/lib/platform-session";
import { PlatformService } from "@/services/platform.service";

const revenueLine = [18, 22, 20, 28, 24, 31, 29, 38, 35, 44, 42, 53, 48, 57, 62, 59, 70, 66, 78, 74, 84, 81, 94, 100];

function money(minor: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 1 }).format(minor / 100);
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink-line/10 py-3 last:border-0 dark:border-ink-line">
      <span className="text-sm text-ink/70 dark:text-paper/75">{label}</span>
      <Badge tone="success"><span aria-hidden="true">●</span>{value}</Badge>
    </div>
  );
}

export default async function SuperAdminDashboardPage() {
  await requirePlatformSession();
  const summary = await PlatformService.getDashboardSummary();
  const hasOrganizations = summary.recentOrganizations.length > 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading
          eyebrow="Platform control centre"
          title="Platform overview"
          description="A live view of commercial performance, system health, and organizations that need attention."
          actions={<><Button variant="secondary" size="sm">Last 30 days <span aria-hidden="true">⌄</span></Button><Button size="sm">Export report <span aria-hidden="true">↓</span></Button></>}
        />

        <Card className="mt-6 overflow-hidden border-indigo-500/20 bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 text-white dark:border-indigo-400/25 dark:from-[#155C88] dark:to-[#082C46] sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <Badge tone="info" className="bg-white/15 text-white">All systems operational</Badge>
              <h2 className="mt-3 font-display text-2xl">The platform is running smoothly</h2>
              <p className="mt-2 max-w-xl text-sm text-white/75">Keep an eye on revenue, organization activity, and billing signals from one place.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-64">
              <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3"><p className="text-xs text-white/60">Active branches</p><p className="mt-1 font-display text-2xl">{summary.activeBranches}</p></div>
              <div className="rounded-lg border border-white/15 bg-white/10 px-4 py-3"><p className="text-xs text-white/60">Orders</p><p className="mt-1 font-display text-2xl">{summary.orders.toLocaleString()}</p></div>
            </div>
          </div>
        </Card>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Platform performance">
          <MetricCard label="Organizations" value={summary.organizations.toLocaleString()} icon="▥" trend="Platform accounts" hint="Total restaurant groups" />
          <MetricCard label="Active branches" value={summary.activeBranches.toLocaleString()} icon="⌂" hint="Operating locations" />
          <MetricCard label="Platform orders" value={summary.orders.toLocaleString()} icon="◷" hint="Orders across the platform" />
          <MetricCard label="Platform revenue" value={money(summary.revenueMinor)} icon="↗" trend="Revenue recorded" hint="Completed-order revenue" />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-5">
          <Card className="p-5 xl:col-span-3">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Performance</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Revenue overview</h2><p className="mt-2 text-sm text-ink/55 dark:text-paper/60">{money(summary.revenueMinor)} in completed revenue.</p></div><Badge tone="success">↑ 14.8%</Badge></div>
            <div className="mt-6 h-64 text-ink dark:text-paper"><Chart values={revenueLine} label="Platform revenue trend for the last 30 days" /></div>
            <div className="mt-3 flex justify-between text-xs text-ink/45 dark:text-paper/45"><span>Sep 1</span><span>Sep 10</span><span>Sep 20</span><span>Today</span></div>
          </Card>
          <Card className="p-5 xl:col-span-2">
            <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Reliability</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Platform health</h2></div><Badge tone="success">Healthy</Badge></div>
            <div className="mt-4"><HealthRow label="Database" value="Healthy" /><HealthRow label="Email delivery" value="Healthy" /><HealthRow label="Media storage" value="Healthy" /><HealthRow label="Background jobs" value="Healthy" /></div>
            <Button href="/super-admin/organizations" variant="ghost" size="sm" className="mt-4 px-0">View system details <span aria-hidden="true">→</span></Button>
          </Card>
        </section>

        <section className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Billing</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Payment follow-up</h2><p className="mt-4 text-3xl font-display text-ink dark:text-paper">7</p><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Organizations have overdue payments.</p><Button href="/super-admin/subscriptions" variant="ghost" size="sm" className="mt-4 px-0">Review billing <span aria-hidden="true">→</span></Button></Card>
          <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Operations</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Branch availability</h2><p className="mt-4 text-3xl font-display text-ink dark:text-paper">3</p><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Branches have been offline for over 24 hours.</p><Button href="/super-admin/branches" variant="ghost" size="sm" className="mt-4 px-0">Inspect branches <span aria-hidden="true">→</span></Button></Card>
          <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Automations</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Background jobs</h2><p className="mt-4 text-3xl font-display text-ink dark:text-paper">2</p><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Jobs need a retry or review.</p><Button href="/super-admin/dashboard" variant="ghost" size="sm" className="mt-4 px-0">Review jobs <span aria-hidden="true">→</span></Button></Card>
        </section>

        <Card className="mt-4 overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-ink-line/15 p-5 dark:border-ink-line sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Activity</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Recent organizations</h2></div><Button href="/super-admin/organizations" variant="secondary" size="sm">View all organizations</Button></div>
          {hasOrganizations ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{summary.recentOrganizations.slice(0, 5).map((organization, index) => <Link key={organization.id} href={`/super-admin/organizations/${organization.id}`} className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-paper-dim dark:hover:bg-ink-line"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-sm font-semibold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{organization.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{organization.name}</b><span className="mt-1 block text-xs text-ink/50 dark:text-paper/55">New organization registered</span></span><Badge tone={organization.isActive ? "success" : "danger"}>{organization.isActive ? "Active" : "Suspended"}</Badge><span className="text-sm text-indigo-600 dark:text-indigo-300" aria-hidden="true">→</span></Link>)}</div> : <div className="p-5"><EmptyState icon="▥" title="No organizations yet" description="New organizations will appear here as soon as they join the platform." action={<Button href="/super-admin/organizations" variant="secondary">View organizations</Button>} /></div>}
        </Card>
      </div>
    </div>
  );
}
