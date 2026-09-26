"use client";

import { type FormEvent, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createLoyaltyRewardAction, setLoyaltyRewardActiveAction } from "@/actions/loyalty.actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

export type LoyaltyRewardSummary = {
  id: string;
  name: string;
  description?: string;
  pointsRequired: number;
  isActive: boolean;
};

export function RewardsManager({ rewards }: { rewards: LoyaltyRewardSummary[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const activeCount = rewards.filter((reward) => reward.isActive).length;

  function createReward(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setNotice(null);
    startTransition(async () => {
      const result = await createLoyaltyRewardAction({
        name: data.get("name"),
        description: data.get("description"),
        pointsRequired: Number(data.get("pointsRequired")),
      });
      if (!result.ok) {
        setNotice({ tone: "error", text: result.error.message });
        return;
      }
      form.reset();
      setNotice({ tone: "success", text: "Reward added to the cashier catalog." });
      router.refresh();
    });
  }

  function toggleReward(reward: LoyaltyRewardSummary) {
    setNotice(null);
    startTransition(async () => {
      const result = await setLoyaltyRewardActiveAction({ rewardId: reward.id, isActive: !reward.isActive });
      if (!result.ok) {
        setNotice({ tone: "error", text: result.error.message });
        return;
      }
      setNotice({ tone: "success", text: `${reward.name} is now ${result.data.isActive ? "available" : "inactive"}.` });
      router.refresh();
    });
  }

  return (
    <section className="mt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Cashier catalog</p>
          <h2 className="mt-1 font-display text-2xl text-ink dark:text-paper">Loyalty rewards</h2>
        </div>
        <p className="text-sm text-ink/55 dark:text-paper/60">{activeCount} active {activeCount === 1 ? "reward" : "rewards"}</p>
      </div>

      {notice ? <p role="status" className={`mb-4 rounded-lg border px-4 py-3 text-sm ${notice.tone === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100" : "border-red-300 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100"}`}>{notice.text}</p> : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="overflow-hidden">
          <div className="divide-y divide-ink-line/10 dark:divide-ink-line">
            {rewards.length ? rewards.map((reward) => (
              <div key={reward.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-200" aria-hidden="true">✦</span>
                <span className="min-w-0 flex-1">
                  <b className="block text-sm text-ink dark:text-paper">{reward.name}</b>
                  <small className="mt-1 block text-xs text-ink/55 dark:text-paper/60">{reward.description || "No reward details"}</small>
                </span>
                <span className="text-right">
                  <b className="block text-sm text-ink dark:text-paper">{reward.pointsRequired.toLocaleString()} pts</b>
                  <Badge tone={reward.isActive ? "success" : "neutral"}>{reward.isActive ? "Active" : "Inactive"}</Badge>
                </span>
                <Button type="button" variant="secondary" size="sm" disabled={isPending} onClick={() => toggleReward(reward)}>
                  {reward.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            )) : <p className="p-6 text-sm text-ink/55 dark:text-paper/60">No loyalty rewards yet. Add one to make it visible in the cashier portal.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">New reward</p>
          <h3 className="mt-1 font-display text-xl text-ink dark:text-paper">Add to the catalog</h3>
          <form onSubmit={createReward} className="mt-5 space-y-3">
            <Input name="name" required minLength={2} maxLength={100} placeholder="Reward name" aria-label="Reward name" />
            <label className="block text-xs font-medium text-ink/70 dark:text-paper/75">Description
              <textarea name="description" maxLength={240} rows={3} placeholder="What the customer receives" className="mt-1 block w-full resize-y rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 dark:border-ink-line dark:bg-ink-soft dark:text-paper" />
            </label>
            <Input name="pointsRequired" type="number" min="1" max="1000000" step="1" required placeholder="Points required" aria-label="Points required" />
            <Button type="submit" disabled={isPending} className="w-full">{isPending ? "Saving…" : "Create reward"}</Button>
          </form>
        </Card>
      </div>
    </section>
  );
}