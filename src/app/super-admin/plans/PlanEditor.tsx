"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePlatformPlanAction } from "@/actions/platform.actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { SubscriptionPlanCatalog, SubscriptionPlanCode } from "@/lib/subscriptions";

function PlanForm({ code, initialPlan }: { code: SubscriptionPlanCode; initialPlan: SubscriptionPlanCatalog[SubscriptionPlanCode] }) {
  const router = useRouter();
  const [plan, setPlan] = useState(initialPlan);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setNotice(null);
    startTransition(async () => {
      const result = await updatePlatformPlanAction({
        code,
        label: form.get("label"),
        monthlyMinor: Math.round(Number(form.get("monthlyPrice")) * 100),
        description: form.get("description"),
        features: String(form.get("features") ?? "").split("\n").map((feature) => feature.trim()).filter(Boolean),
      });
      if (!result.ok) {
        setNotice({ tone: "error", message: result.error.message });
        return;
      }
      setPlan({
        label: String(form.get("label")).trim(),
        monthlyMinor: Math.round(Number(form.get("monthlyPrice")) * 100),
        description: String(form.get("description")).trim(),
        features: String(form.get("features")).split("\n").map((feature) => feature.trim()).filter(Boolean),
      });
      setNotice({ tone: "success", message: "Plan saved and applied to new subscription requests." });
      router.refresh();
    });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-ink-line/15 p-5 dark:border-ink-line">
        <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">{code}</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">{plan.label}</h2></div>
        <Badge tone={code === "TRIAL" ? "neutral" : "info"}>{code === "TRIAL" ? "Trial" : "Paid plan"}</Badge>
      </div>
      <form onSubmit={save} className="space-y-4 p-5">
        <label className="block text-xs font-medium text-ink/70 dark:text-paper/75">Display name
          <input name="label" required minLength={2} maxLength={60} defaultValue={plan.label} className="mt-1 block w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 dark:border-ink-line dark:bg-ink-soft dark:text-paper" />
        </label>
        <label className="block text-xs font-medium text-ink/70 dark:text-paper/75">Monthly price (KES)
          <input name="monthlyPrice" type="number" required min="0" max="1000000" step="0.01" defaultValue={(plan.monthlyMinor / 100).toFixed(2)} className="mt-1 block w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 dark:border-ink-line dark:bg-ink-soft dark:text-paper" />
        </label>
        <label className="block text-xs font-medium text-ink/70 dark:text-paper/75">Description
          <textarea name="description" required minLength={2} maxLength={300} rows={2} defaultValue={plan.description} className="mt-1 block w-full resize-y rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 dark:border-ink-line dark:bg-ink-soft dark:text-paper" />
        </label>
        <label className="block text-xs font-medium text-ink/70 dark:text-paper/75">Features <span className="font-normal text-ink/45 dark:text-paper/50">one per line</span>
          <textarea name="features" required rows={4} defaultValue={plan.features.join("\n")} className="mt-1 block w-full resize-y rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 dark:border-ink-line dark:bg-ink-soft dark:text-paper" />
        </label>
        {notice ? <p role="status" className={`rounded-lg border px-3 py-2 text-xs ${notice.tone === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100" : "border-red-300 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100"}`}>{notice.message}</p> : null}
        <Button type="submit" disabled={isPending} className="w-full">{isPending ? "Saving…" : "Save plan"}</Button>
      </form>
    </Card>
  );
}

export function PlanEditor({ plans }: { plans: SubscriptionPlanCatalog }) {
  return <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {(Object.keys(plans) as SubscriptionPlanCode[]).map((code) => <PlanForm key={code} code={code} initialPlan={plans[code]} />)}
  </section>;
}