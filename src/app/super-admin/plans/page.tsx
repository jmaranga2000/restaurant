import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { PageHeading } from "@/components/ui/PageHeading";
import { formatPlanMoney, SUBSCRIPTION_PLANS } from "@/lib/subscriptions";
import { requirePlatformSession } from "@/lib/platform-session";

export default async function SuperAdminPlansPage() {
  await requirePlatformSession();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading eyebrow="Billing · Catalog" title="Plans" description="The shared subscription tiers and pricing currently offered to restaurant organizations." />
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(SUBSCRIPTION_PLANS).map(([code, plan]) => (
            <Card key={code} className="flex min-h-72 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">{code}</p>
                  <h2 className="mt-1 font-display text-xl text-ink dark:text-paper">{plan.label}</h2>
                </div>
                <Badge tone={code === "TRIAL" ? "neutral" : "info"}>{code === "TRIAL" ? "Free" : "Monthly"}</Badge>
              </div>
              <p className="mt-4 font-display text-2xl text-ink dark:text-paper">{plan.monthlyMinor ? formatPlanMoney(plan.monthlyMinor) : "Free"}<span className="font-sans text-xs font-normal text-ink/45 dark:text-paper/50">{plan.monthlyMinor ? " / month" : ""}</span></p>
              <p className="mt-3 text-sm leading-6 text-ink/60 dark:text-paper/65">{plan.description}</p>
              <ul className="mt-auto space-y-2 pt-5 text-sm text-ink/70 dark:text-paper/75">
                {plan.features.map((feature) => <li key={feature} className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-300" aria-hidden="true">✓</span>{feature}</li>)}
              </ul>
            </Card>
          ))}
        </section>
        <p className="mt-5 border-l-2 border-amber-400 bg-amber-50 p-4 text-xs leading-5 text-amber-900 dark:bg-amber-400/10 dark:text-amber-100">Plan names, prices, and features come from the shared application plan configuration. Editing this catalog is not available in the platform portal.</p>
      </div>
    </div>
  );
}