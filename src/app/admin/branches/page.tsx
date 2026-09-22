import Link from "next/link";
import { createBranchAction } from "@/actions/branch.actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { PageHeading } from "@/components/ui/PageHeading";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { BranchService } from "@/services/branch.service";

export default async function AdminBranchesPage() {
  const ctx = await loadAuthContext(await requireSession());
  const branches = await BranchService.list(ctx);

  async function handleCreate(formData: FormData) {
    "use server";
    await createBranchAction(formData);
  }

  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
    <PageHeading eyebrow="Restaurant administration" title="Branches" description="Set up operating locations and manage their read-only customer displays." />
    <div className="mt-6 grid gap-4 lg:grid-cols-5">
      <Card className="overflow-hidden lg:col-span-3">
        <div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Locations</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Your branches</h2></div>
        {branches.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{branches.map((branch) => <div key={String(branch._id)} className="flex items-center gap-4 px-5 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">⌂</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{branch.name}</b><small className="mt-1 block truncate text-xs text-ink/50 dark:text-paper/55">{branch.code}{branch.address ? ` · ${branch.address}` : ""}</small></span><div className="flex shrink-0 items-center gap-3"><Link href="/admin/displays" className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-300">Manage display ↗</Link><Badge tone={branch.isActive ? "success" : "neutral"}>{branch.isActive ? "Active" : "Inactive"}</Badge></div></div>)}</div> : <div className="p-5"><EmptyState icon="⌂" title="No branches yet" description="Add a branch to organize service, staff access, and daily performance." /></div>}
      </Card>
      <Card className="p-5 lg:col-span-2"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">New location</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Add a branch</h2><p className="mt-2 text-sm text-ink/55 dark:text-paper/60">Give your team a location to operate from.</p><form action={handleCreate} className="mt-5 space-y-3"><Input name="name" required placeholder="Branch name" /><Input name="code" required placeholder="Code, e.g. NBO-01" /><Input name="address" placeholder="Address (optional)" /><Button type="submit" className="w-full">Add branch</Button></form></Card>
    </div>
  </div>;
}
