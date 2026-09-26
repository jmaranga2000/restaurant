import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { connectToDatabase } from "@/lib/db";
import { requirePlatformSession } from "@/lib/platform-session";
import { OrganizationModel } from "@/models/Organization";
import { SubscriptionRequestModel } from "@/models/SubscriptionRequest";

function money(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountMinor / 100);
}

function date(value: Date) {
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium" }).format(value);
}

export default async function SuperAdminRevenuePage() {
  await requirePlatformSession();
  await connectToDatabase();
  const approvedRequests = await SubscriptionRequestModel.find({ status: "APPROVED" }).sort({ updatedAt: -1 }).lean();
  const organizationIds = [...new Set(approvedRequests.map((request) => String(request.organizationId)))];
  const organizations = organizationIds.length ? await OrganizationModel.find({ _id: { $in: organizationIds } }).select("name").lean() : [];
  const organizationNames = new Map(organizations.map((organization) => [String(organization._id), organization.name]));
  const totalsByCurrency = new Map<string, number>();
  for (const request of approvedRequests) totalsByCurrency.set(request.currency, (totalsByCurrency.get(request.currency) ?? 0) + request.amountMinor);
  const primaryCurrency = totalsByCurrency.size === 1 ? [...totalsByCurrency.keys()][0] ?? "KES" : "KES";
  const primaryTotal = totalsByCurrency.get(primaryCurrency) ?? 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading eyebrow="Billing · Performance" title="Revenue" description="Revenue totals include subscription requests explicitly marked approved; pending requests are excluded." />
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricCard label={totalsByCurrency.size === 1 ? "Approved revenue" : "Approved revenue · KES"} value={money(primaryTotal, primaryCurrency)} icon="↗" hint="Approved subscription requests only" />
          <MetricCard label="Approved requests" value={String(approvedRequests.length)} icon="✓" hint="Recorded as paid" />
          <MetricCard label="Currencies" value={String(totalsByCurrency.size)} icon="¤" hint="Currencies represented in approved records" />
        </section>
        {totalsByCurrency.size > 1 ? <Card className="mt-4 p-5"><h2 className="font-display text-lg text-ink dark:text-paper">Revenue by currency</h2><div className="mt-3 flex flex-wrap gap-3">{[...totalsByCurrency].map(([currency, total]) => <Badge key={currency} tone="info">{currency}: {money(total, currency)}</Badge>)}</div></Card> : null}
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><h2 className="font-display text-xl text-ink dark:text-paper">Approved subscription revenue</h2><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Latest confirmed billing records.</p></div>
          {approvedRequests.length ? <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/55 dark:border-ink-line dark:bg-ink dark:text-paper/55"><tr><th className="px-5 py-3 font-medium">Organization</th><th className="px-3 py-3 font-medium">Plan</th><th className="px-3 py-3 font-medium">Billing cycle</th><th className="px-3 py-3 font-medium">Amount</th><th className="px-5 py-3 font-medium">Approved record updated</th></tr></thead>
            <tbody>{approvedRequests.map((request) => <tr key={String(request._id)} className="border-b border-ink-line/10 last:border-0"><td className="px-5 py-4 font-medium text-ink dark:text-paper">{organizationNames.get(String(request.organizationId)) ?? "Unknown organization"}</td><td className="px-3 py-4">{request.plan}</td><td className="px-3 py-4">{request.billingCycle}</td><td className="px-3 py-4 font-medium">{money(request.amountMinor, request.currency)}</td><td className="px-5 py-4 text-xs text-ink/55 dark:text-paper/60">{date(request.updatedAt)}</td></tr>)}</tbody>
          </table></div> : <div className="p-6"><EmptyState icon="↗" title="No approved revenue yet" description="Revenue appears when a subscription request is marked approved. Pending requests are not counted as collected income." /></div>}
        </Card>
        <p className="mt-4 text-xs leading-5 text-ink/50 dark:text-paper/55">No payment-provider transaction ledger is connected. This report reflects approved billing requests and should not be treated as a bank settlement report.</p>
      </div>
    </div>
  );
}