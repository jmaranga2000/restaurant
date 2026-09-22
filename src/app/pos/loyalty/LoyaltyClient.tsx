"use client";

import { type FormEvent, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeLoyaltyPointsAction, createLoyaltyCustomerAction } from "@/actions/loyalty.actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";

type LoyaltyMember = {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  points: number;
  joinedAt: string;
};

type LoyaltyActivity = {
  id: string;
  customerId: string;
  customerName: string;
  type: "EARN" | "REDEEM";
  points: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
};

function tierFor(points: number) {
  if (points >= 1_000) return { label: "Gold", tone: "warning" as const };
  if (points >= 500) return { label: "Silver", tone: "info" as const };
  return { label: "Member", tone: "success" as const };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

export function LoyaltyClient({ members, activity }: { members: LoyaltyMember[]; activity: LoyaltyActivity[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState(members[0]?.id ?? "");
  const [actionType, setActionType] = useState<"EARN" | "REDEEM">("EARN");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; message: string } | null>(null);
  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter((member) => [member.name, member.phone, member.email].filter(Boolean).some((value) => value!.toLowerCase().includes(query)));
  }, [members, search]);
  const totalPoints = members.reduce((total, member) => total + member.points, 0);
  const redeemableMembers = members.filter((member) => member.points >= 500).length;

  function enrollMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setNotice(null);
    startTransition(async () => {
      const result = await createLoyaltyCustomerAction({ name: data.get("name"), phone: data.get("phone"), email: data.get("email") });
      if (!result.ok) {
        setNotice({ tone: "error", message: result.error.message });
        return;
      }
      form.reset();
      setSelectedMemberId(result.data.customerId);
      setNotice({ tone: "success", message: "Loyalty member added. You can now earn or redeem points." });
      router.refresh();
    });
  }

  function updatePoints(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const points = Number(data.get("points"));
    setNotice(null);
    startTransition(async () => {
      const result = await changeLoyaltyPointsAction({ customerId: selectedMemberId, type: actionType, points, reason: data.get("reason") });
      if (!result.ok) {
        setNotice({ tone: "error", message: result.error.message });
        return;
      }
      form.reset();
      setNotice({ tone: "success", message: actionType === "EARN" ? "Points added to the member balance." : "Reward points redeemed successfully." });
      router.refresh();
    });
  }

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeading eyebrow="Cashier portal" title="Loyalty" description="Enroll guests, reward repeat visits, redeem points, and keep every balance change visible." actions={<Button href="/pos">Open register <span aria-hidden="true">→</span></Button>} />
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Loyalty members" value={String(members.length)} icon="◎" hint="Active customer profiles" />
        <MetricCard label="Points in circulation" value={totalPoints.toLocaleString()} icon="✦" hint="Across all listed members" />
        <MetricCard label="Rewards available" value={String(redeemableMembers)} icon="✓" hint="Members with 500+ points" />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-5">
        <Card className="p-5 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Member enrollment</p>
          <h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Add a loyalty member</h2>
          <p className="mt-2 text-sm text-ink/55 dark:text-paper/60">A phone number or email keeps the member’s rewards tied to the right guest.</p>
          <form onSubmit={enrollMember} className="mt-5 space-y-3">
            <Input name="name" required placeholder="Customer name" aria-label="Customer name" />
            <Input name="phone" placeholder="Phone number" aria-label="Phone number" inputMode="tel" />
            <Input name="email" type="email" placeholder="Email address" aria-label="Email address" />
            <Button type="submit" disabled={isPending} className="w-full">{isPending ? "Saving…" : "Add loyalty member"}</Button>
          </form>
        </Card>

        <Card className="p-5 xl:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Points desk</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Reward or redeem</h2></div><Badge tone="info">100 KSh = 1 point</Badge></div>
          <p className="mt-2 text-sm text-ink/55 dark:text-paper/60">Use 500 points for a KSh 500 reward. Every change is recorded in the loyalty ledger.</p>
          {members.length ? <form onSubmit={updatePoints} className="mt-5 grid gap-3 md:grid-cols-2"><label className="text-xs font-medium text-ink/70 dark:text-paper/75">Member<select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} className="mt-1 block w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink-soft dark:text-paper">{members.map((member) => <option key={member.id} value={member.id}>{member.name} · {member.points} pts</option>)}</select></label><label className="text-xs font-medium text-ink/70 dark:text-paper/75">Action<select value={actionType} onChange={(event) => setActionType(event.target.value as "EARN" | "REDEEM")} className="mt-1 block w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink-soft dark:text-paper"><option value="EARN">Add earned points</option><option value="REDEEM">Redeem points</option></select></label><Input name="points" type="number" min="1" step="1" required placeholder="Points" aria-label="Points" /><Input name="reason" required placeholder={actionType === "EARN" ? "Reason, e.g. lunch purchase" : "Reason, e.g. KSh 500 reward"} aria-label="Reason" /><div className="md:col-span-2"><Button type="submit" disabled={isPending}>{isPending ? "Saving…" : actionType === "EARN" ? "Add points" : "Redeem points"}</Button></div></form> : <p className="mt-5 rounded-lg border border-dashed border-ink-line/20 p-5 text-sm text-ink/55 dark:border-ink-line dark:text-paper/60">Add the first loyalty member before recording points.</p>}
        </Card>
      </section>

      {notice ? <p role="status" className={`mt-4 rounded-lg border px-4 py-3 text-sm ${notice.tone === "success" ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-400/10 dark:text-emerald-100" : "border-red-300 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-100"}`}>{notice.message}</p> : null}

      <section className="mt-6 grid gap-4 xl:grid-cols-5">
        <Card className="overflow-hidden xl:col-span-3"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-line/15 p-5 dark:border-ink-line"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Members</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Customer rewards</h2></div><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search members" className="w-full sm:w-52" aria-label="Search members" /></div>{filteredMembers.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{filteredMembers.map((member) => { const tier = tierFor(member.points); return <div key={member.id} className="flex items-center gap-3 px-5 py-4"><span className="grid h-10 w-10 place-items-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200">{member.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{member.name}</b><small className="mt-1 block truncate text-xs text-ink/50 dark:text-paper/55">{member.phone ?? member.email ?? "No contact saved"}</small></span><span className="text-right"><b className="block text-sm text-ink dark:text-paper">{member.points.toLocaleString()} pts</b><Badge tone={tier.tone} className="mt-1">{tier.label}</Badge></span></div>; })}</div> : <div className="p-5 text-sm text-ink/55 dark:text-paper/60">No loyalty member matches that search.</div>}</Card>
        <Card className="overflow-hidden xl:col-span-2"><div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Loyalty ledger</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Recent activity</h2></div>{activity.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{activity.map((entry) => <div key={entry.id} className="px-5 py-4"><div className="flex items-start gap-3"><span className={`mt-0.5 grid h-7 w-7 place-items-center rounded-full text-xs ${entry.type === "EARN" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200" : "bg-amber-50 text-amber-800 dark:bg-amber-400/15 dark:text-amber-100"}`}>{entry.type === "EARN" ? "+" : "−"}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{entry.customerName}</b><small className="mt-1 block text-xs text-ink/50 dark:text-paper/55">{entry.reason}</small></span><span className="text-right"><b className={`block text-sm ${entry.points > 0 ? "text-emerald-700 dark:text-emerald-300" : "text-amber-800 dark:text-amber-100"}`}>{entry.points > 0 ? "+" : ""}{entry.points} pts</b><small className="mt-1 block text-xs text-ink/45 dark:text-paper/50">{formatDate(entry.createdAt)}</small></span></div><p className="mt-2 pl-10 text-xs text-ink/50 dark:text-paper/55">Balance: {entry.balanceAfter} pts</p></div>)}</div> : <div className="p-5 text-sm text-ink/55 dark:text-paper/60">Point awards and redemptions will appear here.</div>}</Card>
      </section>
    </main>
  );
}
