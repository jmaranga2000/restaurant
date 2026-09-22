"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSubscriptionRequestAction } from "@/actions/subscription.actions";
import { Button } from "@/components/ui/Button";
import { SUBSCRIPTION_PLANS, type PaidSubscriptionPlanCode } from "@/lib/subscriptions";

type SubscriptionClientProps = {
  currency: string;
  currentPlan: string;
  billingEmail?: string;
};

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100);
}

export function SubscriptionClient({ currency, currentPlan, billingEmail }: SubscriptionClientProps) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<PaidSubscriptionPlanCode | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "CARD" | "BANK">("MPESA");
  const [billingCycle, setBillingCycle] = useState<"MONTHLY" | "ANNUAL">("MONTHLY");
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  function requestPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setNotice(null);
    startTransition(async () => {
      const result = await createSubscriptionRequestAction({
        plan: selectedPlan,
        billingCycle,
        paymentMethod,
        billingEmail: data.get("billingEmail"),
        mpesaPhone: data.get("mpesaPhone"),
      });
      if (!result.ok) {
        setNotice({ tone: "error", message: result.error.message });
        return;
      }
      setSelectedPlan(null);
      setNotice({ tone: "success", message: "Your subscription request is ready for payment confirmation. Your current plan remains active until payment is approved." });
      router.refresh();
    });
  }

  return (
    <>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        {(["STARTER", "PROFESSIONAL", "ENTERPRISE"] as PaidSubscriptionPlanCode[]).map((plan) => {
          const details = SUBSCRIPTION_PLANS[plan];
          const isCurrent = currentPlan === plan;
          const isRecommended = plan === "PROFESSIONAL";
          return <article key={plan} className={`relative flex min-h-[29rem] flex-col rounded-xl border bg-white p-5 shadow-[0_12px_32px_rgba(8,44,70,0.05)] dark:bg-ink-soft ${isRecommended ? "border-indigo-400 ring-1 ring-indigo-400/25 dark:border-indigo-300" : "border-ink-line/15 dark:border-ink-line"}`}>{isRecommended ? <span className="absolute -top-3 left-5 rounded-full bg-indigo-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.12em] text-white">Most popular</span> : null}<p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">{details.label}</p><p className="mt-4 font-display text-3xl text-ink dark:text-paper">{money(details.monthlyMinor, currency)}<span className="font-sans text-sm font-normal text-ink/50 dark:text-paper/55"> / month</span></p><p className="mt-3 min-h-12 text-sm leading-6 text-ink/60 dark:text-paper/65">{details.description}</p><ul className="mt-5 space-y-3 text-sm text-ink/70 dark:text-paper/75">{details.features.map((feature) => <li key={feature} className="flex gap-2"><span className="text-emerald-600 dark:text-emerald-300" aria-hidden="true">✓</span>{feature}</li>)}</ul><div className="mt-auto pt-6">{isCurrent ? <span className="inline-flex rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100">Current plan</span> : <Button onClick={() => { setSelectedPlan(plan); setNotice(null); }}>Choose {details.label}</Button>}</div></article>;
        })}
      </section>

      {notice ? <p role="status" className={`mt-5 rounded-lg border px-4 py-3 text-sm ${notice.tone === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100" : "border-red-300 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100"}`}>{notice.message}</p> : null}

      {selectedPlan ? <div className="fixed inset-0 z-[100] grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="subscription-checkout-title"><button type="button" aria-label="Close subscription checkout" onClick={() => !isPending && setSelectedPlan(null)} className="absolute inset-0 cursor-default bg-ink/60 backdrop-blur-sm" /><section className="relative z-10 w-full max-w-lg rounded-2xl border border-ink-line/15 bg-white p-6 shadow-2xl dark:border-ink-line dark:bg-ink-soft"><button type="button" disabled={isPending} onClick={() => setSelectedPlan(null)} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-ink/50 hover:bg-paper-dim hover:text-ink disabled:opacity-50 dark:text-paper/55 dark:hover:bg-paper/10 dark:hover:text-paper" aria-label="Close">×</button><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Subscription checkout</p><h2 id="subscription-checkout-title" className="mt-1 font-display text-2xl text-ink dark:text-paper">{SUBSCRIPTION_PLANS[selectedPlan].label}</h2><p className="mt-2 text-sm leading-6 text-ink/60 dark:text-paper/65">Submit a billing request. The plan changes only after the recorded payment is confirmed, so there are no accidental upgrades.</p><form onSubmit={requestPlan} className="mt-5 space-y-4"><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium text-ink/70 dark:text-paper/75">Billing cycle<select value={billingCycle} onChange={(event) => setBillingCycle(event.target.value as "MONTHLY" | "ANNUAL")} className="mt-1 block w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink dark:text-paper"><option value="MONTHLY">Monthly</option><option value="ANNUAL">Annual · 2 months free</option></select></label><label className="text-xs font-medium text-ink/70 dark:text-paper/75">Payment method<select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as "MPESA" | "CARD" | "BANK")} className="mt-1 block w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink dark:text-paper"><option value="MPESA">M-Pesa</option><option value="CARD">Card</option><option value="BANK">Bank transfer</option></select></label></div><label className="block text-xs font-medium text-ink/70 dark:text-paper/75">Billing email<input name="billingEmail" type="email" required defaultValue={billingEmail} className="mt-1 block w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink dark:text-paper" /></label>{paymentMethod === "MPESA" ? <label className="block text-xs font-medium text-ink/70 dark:text-paper/75">M-Pesa phone number<input name="mpesaPhone" required placeholder="07XX XXX XXX" inputMode="tel" className="mt-1 block w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink dark:text-paper" /></label> : null}<div className="rounded-lg bg-paper-dim p-4 dark:bg-ink"><p className="flex justify-between text-sm text-ink/60 dark:text-paper/65"><span>{billingCycle === "ANNUAL" ? "Annual total" : "Due each month"}</span><b className="text-ink dark:text-paper">{money(SUBSCRIPTION_PLANS[selectedPlan].monthlyMinor * (billingCycle === "ANNUAL" ? 10 : 1), currency)}</b></p><p className="mt-2 text-xs leading-5 text-ink/50 dark:text-paper/55">No money is collected by this screen. It creates the secure billing request that your configured payment provider or billing team can confirm.</p></div><Button type="submit" disabled={isPending} className="w-full">{isPending ? "Submitting…" : "Submit subscription request"}</Button></form></section></div> : null}
    </>
  );
}
