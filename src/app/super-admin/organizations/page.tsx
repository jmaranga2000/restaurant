import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { requirePlatformSession } from "@/lib/platform-session";
import { PlatformService } from "@/services/platform.service";

const plans = ["Enterprise", "Professional", "Business", "Starter"];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(date));
}

export default async function SuperAdminOrganizationsPage({ searchParams }: { searchParams: { q?: string; status?: string } }) {
  await requirePlatformSession();
  const allOrganizations = await PlatformService.listOrganizations();
  const query = searchParams.q?.trim().toLowerCase() ?? "";
  const organizations = allOrganizations.filter((organization) => {
    const matchesQuery = !query || organization.name.toLowerCase().includes(query) || organization.slug.toLowerCase().includes(query);
    const matchesStatus = !searchParams.status || searchParams.status === "all" || (searchParams.status === "active" ? organization.isActive : !organization.isActive);
    return matchesQuery && matchesStatus;
  });
  const active = allOrganizations.filter((organization) => organization.isActive).length;
  const suspended = allOrganizations.length - active;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading eyebrow="Platform directory" title="Organizations" description="Manage restaurant groups, their operating status, and platform access." actions={<Button size="sm">Add organization <span aria-hidden="true">+</span></Button>} />

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Organization totals">
          <MetricCard label="Total organizations" value={allOrganizations.length.toLocaleString()} icon="▥" hint="Restaurant groups on platform" />
          <MetricCard label="Active" value={active.toLocaleString()} icon="✓" trend="Available to operate" />
          <MetricCard label="Suspended" value={suspended.toLocaleString()} icon="!" hint="Require review before access" />
          <MetricCard label="Showing results" value={organizations.length.toLocaleString()} icon="⌕" hint="Matching the current filters" />
        </section>

        <Card className="mt-6 p-3 sm:p-4">
          <form className="flex flex-col gap-3 sm:flex-row">
            <Input name="q" defaultValue={searchParams.q} placeholder="Search organizations or slugs…" aria-label="Search organizations" />
            <select name="status" defaultValue={searchParams.status ?? "all"} className="rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink-soft dark:text-paper">
              <option value="all">All statuses</option><option value="active">Active</option><option value="suspended">Suspended</option>
            </select>
            <Button type="submit" size="sm">Filter</Button>
          </form>
        </Card>

        <Card className="mt-4 overflow-hidden">
          {organizations.length === 0 ? <div className="p-5"><EmptyState icon="⌕" title="No organizations match" description="Try another name, slug, or status filter to find the organization you need." /></div> : <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/55 dark:border-ink-line dark:bg-ink dark:text-paper/55"><tr><th className="px-5 py-3 font-medium">Organization</th><th className="px-3 py-3 font-medium">Location</th><th className="px-3 py-3 font-medium">Branches</th><th className="px-3 py-3 font-medium">Plan</th><th className="px-3 py-3 font-medium">Status</th><th className="px-3 py-3 font-medium">Created</th><th className="px-5 py-3 font-medium"> </th></tr></thead><tbody>{organizations.map((organization, index) => <tr key={organization.id} className="border-b border-ink-line/10 last:border-0 hover:bg-paper-dim/70 dark:border-ink-line dark:hover:bg-ink-line"><td className="px-5 py-4"><Link href={`/super-admin/organizations/${organization.id}`} className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{organization.name.slice(0, 2).toUpperCase()}</span><span><b className="block text-sm text-ink dark:text-paper">{organization.name}</b><small className="mt-1 block text-xs text-ink/45 dark:text-paper/50">{organization.slug}</small></span></Link></td><td className="px-3 py-4 text-sm text-ink/60 dark:text-paper/65">{organization.defaultTimezone === "Africa/Nairobi" ? "Nairobi, Kenya" : organization.defaultTimezone}</td><td className="px-3 py-4 font-medium text-ink dark:text-paper">{organization.branchCount ?? 0}</td><td className="px-3 py-4"><Badge tone="info">{plans[index % plans.length]}</Badge></td><td className="px-3 py-4"><Badge tone={organization.isActive ? "success" : "danger"}>{organization.isActive ? "Active" : "Suspended"}</Badge></td><td className="px-3 py-4 text-xs text-ink/55 dark:text-paper/55">{formatDate(organization.createdAt)}</td><td className="px-5 py-4 text-right"><Button href={`/super-admin/organizations/${organization.id}`} variant="ghost" size="sm">Open <span aria-hidden="true">→</span></Button></td></tr>)}</tbody></table></div>}
        </Card>
      </div>
    </div>
  );
}
