import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { connectToDatabase } from "@/lib/db";
import { requirePlatformSession } from "@/lib/platform-session";
import { BranchModel } from "@/models/Branch";
import { OrganizationModel } from "@/models/Organization";

export default async function SuperAdminDisplaysPage() {
  await requirePlatformSession();
  await connectToDatabase();
  const branches = await BranchModel.find().sort({ createdAt: -1 }).limit(500).lean();
  const organizationIds = [...new Set(branches.map((branch) => String(branch.organizationId)))];
  const organizations = organizationIds.length ? await OrganizationModel.find({ _id: { $in: organizationIds } }).select("name").lean() : [];
  const organizationNames = new Map(organizations.map((organization) => [String(organization._id), organization.name]));
  const ready = branches.filter((branch) => branch.isActive && Boolean(branch.customerDisplayKey)).length;
  const inactive = branches.filter((branch) => !branch.isActive).length;
  const missingKey = branches.filter((branch) => branch.isActive && !branch.customerDisplayKey).length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading eyebrow="Operations · Guest experience" title="Displays" description="Monitor branch readiness for secure, read-only customer order displays." />
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Branches" value={branches.length.toLocaleString()} icon="⌂" hint="Across all organizations" />
          <MetricCard label="Display ready" value={ready.toLocaleString()} icon="▣" hint="Active branch with display access" />
          <MetricCard label="Needs attention" value={(inactive + missingKey).toLocaleString()} icon="!" hint={`${inactive} inactive · ${missingKey} missing display key`} />
        </section>
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><h2 className="font-display text-xl text-ink dark:text-paper">Branch display readiness</h2><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Display access keys are never shown in the platform list.</p></div>
          {branches.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/55 dark:border-ink-line dark:bg-ink dark:text-paper/55"><tr><th className="px-5 py-3 font-medium">Branch</th><th className="px-3 py-3 font-medium">Organization</th><th className="px-3 py-3 font-medium">Code</th><th className="px-3 py-3 font-medium">Branch status</th><th className="px-5 py-3 font-medium">Display status</th></tr></thead>
            <tbody>{branches.map((branch) => {
              const displayReady = branch.isActive && Boolean(branch.customerDisplayKey);
              const displayStatus = !branch.isActive ? "Unavailable · inactive branch" : displayReady ? "Ready" : "Missing access key";
              return <tr key={String(branch._id)} className="border-b border-ink-line/10 last:border-0"><td className="px-5 py-4 font-medium text-ink dark:text-paper">{branch.name}</td><td className="px-3 py-4">{organizationNames.get(String(branch.organizationId)) ?? "Unknown organization"}</td><td className="px-3 py-4 text-xs text-ink/60 dark:text-paper/65">{branch.code}</td><td className="px-3 py-4"><Badge tone={branch.isActive ? "success" : "neutral"}>{branch.isActive ? "Active" : "Inactive"}</Badge></td><td className="px-5 py-4"><Badge tone={displayReady ? "success" : "warning"}>{displayStatus}</Badge></td></tr>;
            })}</tbody>
          </table></div> : <div className="p-6"><EmptyState icon="▣" title="No branches yet" description="Customer displays are provisioned per branch. Branches will appear here when organizations add locations." /></div>}
        </Card>
      </div>
    </div>
  );
}