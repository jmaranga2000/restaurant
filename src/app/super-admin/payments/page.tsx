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
  return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(value);
}

function statusTone(status: string) {
  if (status === "APPROVED") return "success" as const;
  if (status === "PENDING") return "warning" as const;
  if (status === "REJECTED") return "danger" as const;
  return "neutral" as const;
}

export default async function SuperAdminPaymentsPage() {
  await requirePlatformSession();
  await connectToDatabase();
  const requests = await SubscriptionRequestModel.find().sort({ createdAt: -1 }).limit(200).lean();
  const organizationIds = [...new Set(requests.map((request) => String(request.organizationId)))];
  const organizations = organizationIds.length ? await OrganizationModel.find({ _id: { $in: organizationIds } }).select("name").lean() : [];
  const organizationNames = new Map(organizations.map((organization) => [String(organization._id), organization.name]));
  const pending = requests.filter((request) => request.status === "PENDING").length;
  const approved = requests.filter((request) => request.status === "APPROVED").length;
  const declined = requests.filter((request) => request.status === "REJECTED" || request.status === "CANCELLED").length;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading eyebrow="Billing · Activity" title="Payments" description="Review subscription payment requests and their recorded processing status." />
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricCard label="Pending requests" value={String(pending)} icon="◷" hint="Awaiting payment confirmation" />
          <MetricCard label="Approved requests" value={String(approved)} icon="✓" hint="Marked as paid" />
          <MetricCard label="Rejected or cancelled" value={String(declined)} icon="×" hint="Closed without approval" />
        </section>
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><h2 className="font-display text-xl text-ink dark:text-paper">Subscription payment requests</h2><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Showing the latest {requests.length} records.</p></div>
          {requests.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/55 dark:border-ink-line dark:bg-ink dark:text-paper/55"><tr><th className="px-5 py-3 font-medium">Organization</th><th className="px-3 py-3 font-medium">Plan</th><th className="px-3 py-3 font-medium">Requested by</th><th className="px-3 py-3 font-medium">Method / cycle</th><th className="px-3 py-3 font-medium">Amount</th><th className="px-3 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Created</th></tr></thead>
            <tbody>{requests.map((request) => <tr key={String(request._id)} className="border-b border-ink-line/10 last:border-0">
              <td className="px-5 py-4 font-medium text-ink dark:text-paper">{organizationNames.get(String(request.organizationId)) ?? "Unknown organization"}</td>
              <td className="px-3 py-4">{request.plan}</td>
              <td className="px-3 py-4 text-ink/60 dark:text-paper/65">{request.billingEmail}</td>
              <td className="px-3 py-4 text-xs text-ink/60 dark:text-paper/65">{request.paymentMethod} · {request.billingCycle}</td>
              <td className="px-3 py-4 font-medium">{money(request.amountMinor, request.currency)}</td>
              <td className="px-3 py-4"><Badge tone={statusTone(request.status)}>{request.status}</Badge></td>
              <td className="px-5 py-4 text-xs text-ink/55 dark:text-paper/60">{date(request.createdAt)}</td>
            </tr>)}</tbody>
          </table></div> : <div className="p-6"><EmptyState icon="¤" title="No payment requests yet" description="Subscription requests will appear here when organizations submit them." /></div>}
        </Card>
        <p className="mt-4 text-xs leading-5 text-ink/50 dark:text-paper/55">These are request records, not gateway transactions. Payment collection and status confirmation are handled outside this view.</p>
      </div>
    </div>
  );
}