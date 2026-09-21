import Link from "next/link";
import { requireSession } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { loadAuthContext } from "@/permissions/authorize";
import { InventoryService } from "@/services/inventory.service";
import { StockMovementModel } from "@/models/StockMovement";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { InventoryItemForm } from "./InventoryItemForm";
import { MovementForm } from "./MovementForm";

function quantity(value: number) {
  return new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 }).format(value);
}

function money(valueMinor: number) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(valueMinor / 100);
}

const movementTone: Record<string, "info" | "success" | "warning" | "danger" | "neutral"> = {
  PURCHASE: "success", OPENING_BALANCE: "success", RETURN: "success", TRANSFER_IN: "info",
  SALE_CONSUMPTION: "neutral", TRANSFER_OUT: "warning", WASTE: "danger", ADJUSTMENT: "warning",
};

function movementLabel(type: string) {
  return type.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function InventoryPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);

  if (!ctx.activeBranchId) {
    return (
      <main className="min-h-screen bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <PageHeading eyebrow="Inventory" title="Choose a branch first" description="Inventory belongs to a specific branch so your team always sees the stock that is actually on site." actions={<Button href="/workspace" variant="secondary">Back to workspace</Button>} />
          <div className="mt-6"><EmptyState icon="▤" title="No active branch selected" description="Select a branch from your workspace, then return to record stock and review its movement ledger." action={<Button href="/workspace">Open workspace</Button>} /></div>
        </div>
      </main>
    );
  }

  const [items, movements] = await Promise.all([
    InventoryService.listForBranch(ctx, ctx.activeBranchId),
    (async () => {
      await connectToDatabase();
      return StockMovementModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }).sort({ createdAt: -1 }).limit(16).lean();
    })(),
  ]);

  const itemNames = new Map(items.map((item) => [String(item._id), item.name]));
  const lowStock = items.filter((item) => item.quantityOnHand <= item.reorderLevel);
  const outOfStock = items.filter((item) => item.quantityOnHand <= 0);
  const stockValueMinor = Math.round(items.reduce((sum, item) => sum + item.quantityOnHand * item.averageUnitCostMinor, 0));
  const itemsForForm = items.map((item) => ({ id: String(item._id), name: item.name, unit: item.unit, quantityOnHand: item.quantityOnHand }));

  return (
    <main className="min-h-screen bg-paper text-ink transition-colors dark:bg-ink dark:text-paper">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <PageHeading
          eyebrow="Operations · Stock ledger"
          title="Inventory control"
          description="A branch-level view of ingredient health, stock value, and every recorded movement."
          actions={<><Button href="#record-movement">Record movement</Button><Button href="/workspace" variant="secondary">Back to workspace</Button></>}
        />

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Inventory summary">
          <MetricCard label="Ingredients" value={String(items.length)} icon="▤" hint="Tracked at this branch" />
          <MetricCard label="Low stock" value={String(lowStock.length)} icon="!" hint={lowStock.length ? "Needs purchasing attention" : "All items above reorder level"} />
          <MetricCard label="Out of stock" value={String(outOfStock.length)} icon="×" hint={outOfStock.length ? "Cannot be consumed until restocked" : "No stock-outs recorded"} />
          <MetricCard label="Stock value" value={money(stockValueMinor)} icon="↗" hint="Based on average unit cost" />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-ink-line/15 p-5 dark:border-ink-line sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Current stock</p>
                <h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Ingredient health</h2>
                <p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Quantity on hand is a fast view. The ledger below remains the source of truth.</p>
              </div>
              <Badge tone={lowStock.length ? "warning" : "success"}>{lowStock.length ? `${lowStock.length} to review` : "Stock healthy"}</Badge>
            </div>

            {items.length ? (
              <>
                <div className="divide-y divide-ink-line/10 dark:divide-ink-line sm:hidden">
                  {items.map((item) => <StockCard key={String(item._id)} item={item} />)}
                </div>
                <div className="hidden overflow-x-auto sm:block">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/50 dark:border-ink-line dark:bg-ink dark:text-paper/50">
                      <tr><th className="px-5 py-3 font-medium">Ingredient</th><th className="px-4 py-3 font-medium">On hand</th><th className="px-4 py-3 font-medium">Stock health</th><th className="px-4 py-3 font-medium">Reorder at</th><th className="px-5 py-3 text-right font-medium">Average cost</th></tr>
                    </thead>
                    <tbody>{items.map((item) => {
                      const low = item.quantityOnHand <= item.reorderLevel;
                      const progress = item.reorderLevel > 0 ? Math.min(100, Math.max(0, Math.round((item.quantityOnHand / item.reorderLevel) * 50))) : 100;
                      return <tr key={String(item._id)} className="border-b border-ink-line/10 last:border-0 dark:border-ink-line"><td className="px-5 py-4"><b className="block font-medium text-ink dark:text-paper">{item.name}</b><small className="mt-1 block text-xs text-ink/45 dark:text-paper/50">{item.unit} · Ledger tracked</small></td><td className={`px-4 py-4 font-medium tabular-nums ${low ? "text-status-cancelled" : "text-ink dark:text-paper"}`}>{quantity(item.quantityOnHand)} {item.unit}</td><td className="px-4 py-4"><div className="flex items-center gap-3"><div className="h-2 w-20 overflow-hidden rounded-full bg-paper-dim dark:bg-paper/10"><span className={`block h-full rounded-full ${item.quantityOnHand <= 0 ? "bg-status-cancelled" : low ? "bg-status-preparing" : "bg-status-ready"}`} style={{ width: `${progress}%` }} /></div><Badge tone={item.quantityOnHand <= 0 ? "danger" : low ? "warning" : "success"}>{item.quantityOnHand <= 0 ? "Out" : low ? "Low" : "Healthy"}</Badge></div></td><td className="px-4 py-4 tabular-nums text-ink/60 dark:text-paper/65">{quantity(item.reorderLevel)} {item.unit}</td><td className="px-5 py-4 text-right tabular-nums text-ink/65 dark:text-paper/70">{item.averageUnitCostMinor ? money(item.averageUnitCostMinor) : "—"}</td></tr>;
                    })}</tbody>
                  </table>
                </div>
              </>
            ) : <div className="p-5"><EmptyState icon="▤" title="Start your stock ledger" description="Add the ingredients your restaurant uses, then record opening balances and all future movements." /></div>}
          </Card>

          <div className="space-y-5">
            <Card className="p-5">
              <p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Attention needed</p>
              <h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Low-stock alerts</h2>
              {lowStock.length ? <div className="mt-4 space-y-2">{lowStock.slice(0, 5).map((item) => <div key={String(item._id)} className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-3 dark:bg-amber-400/10"><span className="min-w-0"><b className="block truncate text-sm text-ink dark:text-paper">{item.name}</b><small className="mt-1 block text-xs text-ink/55 dark:text-paper/60">Reorder at {quantity(item.reorderLevel)} {item.unit}</small></span><span className="shrink-0 text-right text-sm font-semibold text-amber-700 dark:text-amber-200">{quantity(item.quantityOnHand)}<small className="ml-1 text-xs font-normal">{item.unit}</small></span></div>)}</div> : <p className="mt-4 text-sm leading-6 text-ink/55 dark:text-paper/60">No ingredients are at or below their reorder level.</p>}
            </Card>
            <InventoryItemForm />
            <div id="record-movement"><MovementForm branchId={ctx.activeBranchId} items={itemsForForm} /></div>
          </div>
        </section>

        <section className="mt-5">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-ink-line/15 p-5 dark:border-ink-line sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Recent activity</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Stock movement ledger</h2></div><p className="text-xs text-ink/50 dark:text-paper/55">All movements are retained for audit and reconciliation.</p></div>
            {movements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/50 dark:border-ink-line dark:bg-ink dark:text-paper/50"><tr><th className="px-5 py-3 font-medium">Movement</th><th className="px-4 py-3 font-medium">Ingredient</th><th className="px-4 py-3 font-medium">Quantity</th><th className="px-4 py-3 font-medium">Note</th><th className="px-5 py-3 text-right font-medium">Recorded</th></tr></thead><tbody>{movements.map((movement) => <tr key={String(movement._id)} className="border-b border-ink-line/10 last:border-0 dark:border-ink-line"><td className="px-5 py-4"><Badge tone={movementTone[movement.type] ?? "neutral"}>{movementLabel(movement.type)}</Badge></td><td className="px-4 py-4 font-medium text-ink dark:text-paper">{itemNames.get(String(movement.inventoryItemId)) ?? "Inventory item"}</td><td className={`px-4 py-4 font-medium tabular-nums ${movement.quantity < 0 ? "text-status-cancelled" : "text-status-ready"}`}>{movement.quantity > 0 ? "+" : ""}{quantity(movement.quantity)}</td><td className="max-w-xs truncate px-4 py-4 text-ink/55 dark:text-paper/60">{movement.note ?? "—"}</td><td className="px-5 py-4 text-right text-xs text-ink/55 dark:text-paper/60">{new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(movement.createdAt)}</td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyState icon="↗" title="No stock movements yet" description="Your first opening balance, adjustment, return, or waste entry will appear here." /></div>}
          </Card>
        </section>
      </div>
    </main>
  );
}

function StockCard({ item }: { item: { name: string; unit: string; quantityOnHand: number; reorderLevel: number; averageUnitCostMinor: number } }) {
  const low = item.quantityOnHand <= item.reorderLevel;
  return <div className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><b className="block truncate text-sm text-ink dark:text-paper">{item.name}</b><p className="mt-1 text-xs text-ink/50 dark:text-paper/55">Reorder at {quantity(item.reorderLevel)} {item.unit}</p></div><Badge tone={item.quantityOnHand <= 0 ? "danger" : low ? "warning" : "success"}>{item.quantityOnHand <= 0 ? "Out" : low ? "Low" : "Healthy"}</Badge></div><div className="mt-4 flex items-end justify-between"><p className={`font-display text-2xl ${low ? "text-status-cancelled" : "text-ink dark:text-paper"}`}>{quantity(item.quantityOnHand)} <span className="text-sm font-normal">{item.unit}</span></p><p className="text-xs text-ink/50 dark:text-paper/55">{item.averageUnitCostMinor ? money(item.averageUnitCostMinor) : "No cost yet"}</p></div></div>;
}
