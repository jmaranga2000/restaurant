import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { InventoryService } from "@/services/inventory.service";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { InventoryItemForm } from "../InventoryItemForm";
import { InventorySectionNav } from "../InventorySectionNav";
import { MovementForm } from "../MovementForm";

export default async function NewStockPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS, PERMISSIONS.INVENTORY_VIEW);

  if (!ctx.activeBranchId) {
    return <main className="min-h-screen bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8"><div className="mx-auto max-w-5xl"><PageHeading eyebrow="Inventory" title="Choose a branch first" description="Select a branch before adding its stock." actions={<Button href="/workspace" variant="secondary">Back to workspace</Button>} /><div className="mt-6"><EmptyState icon="▤" title="No active branch selected" description="Stock must belong to a specific branch." action={<Button href="/workspace">Open workspace</Button>} /></div></div></main>;
  }

  const items = await InventoryService.listForBranch(ctx, ctx.activeBranchId);
  const stockItems = items.map((item) => ({ id: String(item._id), name: item.name, unit: item.unit, quantityOnHand: item.quantityOnHand }));

  return (
    <main className="min-h-screen bg-paper text-ink transition-colors dark:bg-ink dark:text-paper">
      <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        <PageHeading eyebrow="Inventory · Receive stock" title="New stock" description="Create a stock item, then establish its opening balance through the same ledger that records every future change." actions={<><Button href="/inventory" variant="secondary">Stock list</Button><Button href="/inventory/ledger" variant="secondary">View ledger</Button></>} />
        <InventorySectionNav />

        <section className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <InventoryItemForm />
          <MovementForm branchId={ctx.activeBranchId} items={stockItems} initialType="OPENING_BALANCE" />
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <Card className="p-5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 font-display text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">1</span><h2 className="mt-4 font-display text-lg text-ink dark:text-paper">Create the item</h2><p className="mt-2 text-sm leading-6 text-ink/55 dark:text-paper/60">Set the ingredient, its unit, and the level at which it needs attention.</p></Card>
          <Card className="p-5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 font-display text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">2</span><h2 className="mt-4 font-display text-lg text-ink dark:text-paper">Record its balance</h2><p className="mt-2 text-sm leading-6 text-ink/55 dark:text-paper/60">Use an opening balance for first counts, or choose an adjustment, return, or waste movement.</p></Card>
          <Card className="p-5"><span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 font-display text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">3</span><h2 className="mt-4 font-display text-lg text-ink dark:text-paper">Keep the history</h2><p className="mt-2 text-sm leading-6 text-ink/55 dark:text-paper/60">The ledger preserves the reason, quantity, and time behind every change for reconciliation.</p></Card>
        </section>
      </div>
    </main>
  );
}
