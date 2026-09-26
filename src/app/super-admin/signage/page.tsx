import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { connectToDatabase } from "@/lib/db";
import { requirePlatformSession } from "@/lib/platform-session";
import { OrganizationModel } from "@/models/Organization";

const signagePlans = new Set(["PROFESSIONAL", "ENTERPRISE"]);

export default async function SuperAdminSignagePage() {
  await requirePlatformSession();
  await connectToDatabase();
  const organizations = await OrganizationModel.find().select("name isActive subscription.plan subscription.enabledModules").sort({ name: 1 }).lean();
  const eligibleOrganizations = organizations.filter((organization) => signagePlans.has(organization.subscription?.plan ?? "") || organization.subscription?.enabledModules?.includes("signage"));
  const activeEligible = eligibleOrganizations.filter((organization) => organization.isActive).length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading eyebrow="Operations · Promotion" title="Signage" description="Review organization eligibility for digital signage across the platform." />
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Organizations" value={organizations.length.toLocaleString()} icon="▥" hint="Platform accounts" />
          <MetricCard label="Eligible organizations" value={eligibleOrganizations.length.toLocaleString()} icon="▤" hint="Professional, Enterprise, or enabled override" />
          <MetricCard label="Active and eligible" value={activeEligible.toLocaleString()} icon="✓" hint="Organizations currently active" />
        </section>
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><h2 className="font-display text-xl text-ink dark:text-paper">Digital signage eligibility</h2><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Eligibility follows each organization’s plan or enabled-module override.</p></div>
          {organizations.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/55 dark:border-ink-line dark:bg-ink dark:text-paper/55"><tr><th className="px-5 py-3 font-medium">Organization</th><th className="px-3 py-3 font-medium">Plan</th><th className="px-3 py-3 font-medium">Account</th><th className="px-5 py-3 font-medium">Signage access</th></tr></thead>
            <tbody>{organizations.map((organization) => {
              const plan = organization.subscription?.plan ?? "TRIAL";
              const eligible = signagePlans.has(plan) || Boolean(organization.subscription?.enabledModules?.includes("signage"));
              return <tr key={String(organization._id)} className="border-b border-ink-line/10 last:border-0"><td className="px-5 py-4 font-medium text-ink dark:text-paper">{organization.name}</td><td className="px-3 py-4">{plan}</td><td className="px-3 py-4"><Badge tone={organization.isActive ? "success" : "neutral"}>{organization.isActive ? "Active" : "Suspended"}</Badge></td><td className="px-5 py-4"><Badge tone={eligible ? "info" : "neutral"}>{eligible ? "Eligible" : "Not included"}</Badge></td></tr>;
            })}</tbody>
          </table></div> : <div className="p-6"><EmptyState icon="▤" title="No organizations yet" description="Organization plan access will appear here as restaurants join the platform." /></div>}
        </Card>
        <Card className="mt-4 p-5"><EmptyState icon="▤" title="Campaign tracking is not configured" description="The platform currently has no persisted signage campaign or schedule records. This view reports plan access only; it does not imply campaigns are running." /></Card>
      </div>
    </div>
  );
}