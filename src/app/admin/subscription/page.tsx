import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { formatPlanMoney, SUBSCRIPTION_PLANS } from "@/lib/subscriptions";
import { requireSession } from "@/lib/session";
import { OrganizationModel } from "@/models/Organization";
import { SubscriptionRequestModel } from "@/models/SubscriptionRequest";
import { loadAuthContext } from "@/permissions/authorize";
import { SubscriptionClient } from "./SubscriptionClient";

function formatDate(date?: Date | null) {
  return date ? new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "long", year: "numeric" }).format(date) : "Not set";
}

export default async function SubscriptionPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  const [organization, pendingRequest] = await Promise.all([
    OrganizationModel.findById(ctx.organizationId).select("name email defaultCurrency subscription").lean(),
    SubscriptionRequestModel.findOne({ organizationId: ctx.organizationId, status: "PENDING" }).sort({ createdAt: -1 }).lean(),
  ]);
  const currentPlan = organization?.subscription?.plan ?? "TRIAL";
  const currentStatus = organization?.subscription?.status ?? "TRIAL";
  const planDetails = SUBSCRIPTION_PLANS[currentPlan];
  const currency = organization?.defaultCurrency ?? "KES";

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeading eyebrow="Restaurant administration" title="Subscription & billing" description="Choose a plan, submit a secure payment request, and keep your restaurant’s subscription status visible." />
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Current subscription</p><h2 className="mt-1 font-display text-2xl text-ink dark:text-paper">{planDetails.label}</h2><p className="mt-2 text-sm text-ink/55 dark:text-paper/60">{planDetails.description}</p></div><Badge tone={currentStatus === "ACTIVE" ? "success" : currentStatus === "PAST_DUE" ? "warning" : currentStatus === "SUSPENDED" ? "danger" : "info"}>{currentStatus.replace(/_/g, " ")}</Badge></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><MetricCard label="Plan price" value={planDetails.monthlyMinor ? `${formatPlanMoney(planDetails.monthlyMinor, currency)}/mo` : "Free"} icon="¤" /><MetricCard label="Renewal date" value={formatDate(organization?.subscription?.currentPeriodEndsAt)} icon="◷" hint="Confirmed billing period" /><MetricCard label="Restaurant" value={organization?.name ?? "—"} icon="⌂" hint="Billing account" /></div></Card>
        <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Billing progress</p>{pendingRequest ? <><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Payment confirmation pending</h2><p className="mt-3 text-sm leading-6 text-ink/60 dark:text-paper/65">{pendingRequest.plan.charAt(0) + pendingRequest.plan.slice(1).toLowerCase()} · {pendingRequest.billingCycle.toLowerCase()} · {formatPlanMoney(pendingRequest.amountMinor, pendingRequest.currency)}</p><p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800 dark:bg-amber-400/10 dark:text-amber-100">Submitting another request replaces this pending request. Your current subscription stays unchanged until payment confirmation.</p></> : <><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">No pending request</h2><p className="mt-3 text-sm leading-6 text-ink/60 dark:text-paper/65">Select a plan below to start the billing process. Plan access changes only after payment confirmation.</p></>}</Card>
      </section>
      <div className="mt-10"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Plans</p><h2 className="mt-1 font-display text-2xl text-ink dark:text-paper">Choose the right plan for your restaurant</h2></div>
      <SubscriptionClient currency={currency} currentPlan={currentPlan} billingEmail={organization?.email ?? undefined} />
    </div>
  );
}
