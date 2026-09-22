import { requireSession } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { loadAuthContext } from "@/permissions/authorize";
import { InventoryService } from "@/services/inventory.service";
import { StockMovementModel, STOCK_MOVEMENT_TYPES } from "@/models/StockMovement";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { InventorySectionNav } from "../InventorySectionNav";
import { formatQuantity, movementLabel, movementTone } from "../inventory-helpers";

export default async function StockLedgerPage({ searchParams }: { searchParams?: { item?: string; type?: string } }) {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);

  if (!ctx.activeBranchId) {
    return <main className="min-h-screen bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8"><div className="mx-auto max-w-5xl"><PageHeading eyebrow="Inventory" title="Choose a branch first" description="Select a branch before reviewing its stock ledger." actions={<Button href="/workspace" variant="secondary">Back to workspace</Button>} /><div className="mt-6"><EmptyState icon="↗" title="No active branch selected" description="A ledger is always tied to a single branch." action={<Button href="/workspace">Open workspace</Button>} /></div></div></main>;
  }

  const items = await InventoryService.listForBranch(ctx, ctx.activeBranchId);
  const selectedItem = items.find((item) => String(item._id) === searchParams?.item);
  const selectedType = STOCK_MOVEMENT_TYPES.find((type) => type === searchParams?.type);
  const filters: Record<string, unknown> = { organizationId: ctx.organizationId, branchId: ctx.activeBranchId };
  if (selectedItem) filters.inventoryItemId = selectedItem._id;
  if (selectedType) filters.type = selectedType;

  await connectToDatabase();
  const movements = await StockMovementModel.find(filters).sort({ createdAt: -1 }).lean();
  const itemNames = new Map(items.map((item) => [String(item._id), item.name]));

  return (
    <main className="min-h-screen bg-paper text-ink transition-colors dark:bg-ink dark:text-paper">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <PageHeading eyebrow="Inventory · Audit trail" title="Stock ledger" description="The source of truth for every stock-in and stock-out movement at this branch." actions={<><Button href="/inventory/new">Record stock</Button><Button href="/inventory" variant="secondary">Stock list</Button></>} />
        <InventorySectionNav />

        <Card className="mt-6 p-4 sm:p-5">
          <form className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">Ingredient<select name="item" defaultValue={selectedItem ? String(selectedItem._id) : ""} className="inventory-input mt-1.5"><option value="">All ingredients</option>{items.map((item) => <option key={String(item._id)} value={String(item._id)}>{item.name}</option>)}</select></label>
            <label className="block text-xs font-medium text-ink/65 dark:text-paper/70">Movement type<select name="type" defaultValue={selectedType ?? ""} className="inventory-input mt-1.5"><option value="">All movement types</option>{STOCK_MOVEMENT_TYPES.map((type) => <option key={type} value={type}>{movementLabel(type)}</option>)}</select></label>
            <Button type="submit" variant="secondary">Apply filters</Button>
          </form>
        </Card>

        <Card className="mt-5 overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-ink-line/15 p-5 dark:border-ink-line sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Movement history</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">{movements.length} recorded {movements.length === 1 ? "movement" : "movements"}</h2></div><p className="text-xs text-ink/50 dark:text-paper/55">Entries cannot be overwritten; record a correcting movement instead.</p></div>
          {movements.length ? <>
            <div className="divide-y divide-ink-line/10 dark:divide-ink-line sm:hidden">
              {movements.map((movement) => <div key={String(movement._id)} className="p-4"><div className="flex items-start justify-between gap-3"><div><Badge tone={movementTone[movement.type] ?? "neutral"}>{movementLabel(movement.type)}</Badge><b className="mt-2 block text-sm text-ink dark:text-paper">{itemNames.get(String(movement.inventoryItemId)) ?? "Inventory item"}</b></div><span className={`text-sm font-semibold tabular-nums ${movement.quantity < 0 ? "text-status-cancelled" : "text-status-ready"}`}>{movement.quantity > 0 ? "+" : ""}{formatQuantity(movement.quantity)}</span></div><p className="mt-3 text-xs text-ink/55 dark:text-paper/60">{movement.note ?? "No note recorded"}</p><time className="mt-2 block text-[11px] text-ink/45 dark:text-paper/50">{new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(movement.createdAt)}</time></div>)}
            </div>
            <div className="hidden overflow-x-auto sm:block"><table className="w-full min-w-[820px] text-left text-sm"><thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/50 dark:border-ink-line dark:bg-ink dark:text-paper/50"><tr><th className="px-5 py-3 font-medium">Movement</th><th className="px-4 py-3 font-medium">Ingredient</th><th className="px-4 py-3 font-medium">Quantity</th><th className="px-4 py-3 font-medium">Reference</th><th className="px-4 py-3 font-medium">Note</th><th className="px-5 py-3 text-right font-medium">Recorded</th></tr></thead><tbody>{movements.map((movement) => <tr key={String(movement._id)} className="border-b border-ink-line/10 last:border-0 dark:border-ink-line"><td className="px-5 py-4"><Badge tone={movementTone[movement.type] ?? "neutral"}>{movementLabel(movement.type)}</Badge></td><td className="px-4 py-4 font-medium text-ink dark:text-paper">{itemNames.get(String(movement.inventoryItemId)) ?? "Inventory item"}</td><td className={`px-4 py-4 font-medium tabular-nums ${movement.quantity < 0 ? "text-status-cancelled" : "text-status-ready"}`}>{movement.quantity > 0 ? "+" : ""}{formatQuantity(movement.quantity)}</td><td className="px-4 py-4 text-xs text-ink/55 dark:text-paper/60">{movement.reference?.kind?.replaceAll("_", " ") ?? "MANUAL"}</td><td className="max-w-xs truncate px-4 py-4 text-ink/55 dark:text-paper/60">{movement.note ?? "—"}</td><td className="px-5 py-4 text-right text-xs text-ink/55 dark:text-paper/60">{new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(movement.createdAt)}</td></tr>)}</tbody></table></div>
          </> : <div className="p-6"><EmptyState icon="↗" title="No matching movements" description="Opening balances, purchases, adjustments, sales consumption, and waste will appear here as they are recorded." action={<Button href="/inventory/new">Record stock</Button>} /></div>}
        </Card>
      </div>
    </main>
  );
}
