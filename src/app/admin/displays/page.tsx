import Link from "next/link";
import { rotateCustomerDisplayKeyAction } from "@/actions/branch.actions";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { requireSession } from "@/lib/session";
import { loadAuthContext } from "@/permissions/authorize";
import { DisplayService } from "@/services/display.service";

export default async function AdminDisplaysPage() {
  const ctx = await loadAuthContext(await requireSession());
  const branches = await DisplayService.list(ctx);

  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
    <PageHeading eyebrow="Restaurant administration" title="Customer displays" description="Guest screens use their own read-only, revocable access keys. They display menu and order readiness only—never staff controls, customer profiles, or payment data." />
    <Card className="mt-6 p-5">
      {branches.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{branches.map((branch) => {
        if (!branch.customerDisplayKey) return null;
        return <div key={String(branch._id)} className="rounded-xl border border-ink-line/15 p-4 dark:border-ink-line"><p className="font-display text-lg text-ink dark:text-paper">{branch.name}</p><p className="mt-1 text-xs text-ink/50 dark:text-paper/55">{branch.code} · Guest display</p><div className="mt-5 grid gap-2"><Link href={`/display/${branch.customerDisplayKey}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">Launch display ↗</Link><form action={rotateCustomerDisplayKeyAction.bind(null, String(branch._id))}><Button type="submit" variant="secondary" size="sm" className="w-full">Rotate display key</Button></form></div></div>;
      })}</div> : <EmptyState icon="▣" title="No active branches" description="Create a branch first, then launch a dedicated guest display for it." action={<Button href="/admin/branches">Manage branches</Button>} />}
    </Card>
  </div>;
}
