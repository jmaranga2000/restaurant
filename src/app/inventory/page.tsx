import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { InventoryService } from "@/services/inventory.service";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { InventorySectionNav } from "./InventorySectionNav";
import { formatMoney, formatQuantity, stockHealth } from "./inventory-helpers";

export default async function InventoryPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS, PERMISSIONS.INVENTORY_VIEW);

  if (!ctx.activeBranchId) {
    return (
      <main className="min-h-screen bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
        <div className="mx-auto max-w-5xl">
          <PageHeading eyebrow="Inventory" title="Choose a branch first" description="Stock is managed by branch, so every count and movement stays tied to the place it happened." actions={<Button href="/workspace" variant="secondary">Back to workspace</Button>} />
          <div className="mt-6"><EmptyState icon="▤" title="No active branch selected" description="Select a branch from your workspace, then return to manage stock." action={<Button href="/workspace">Open workspace</Button>} /></div>
        </div>
      </main>
    );
  }

  const items = await InventoryService.listForBranch(ctx, ctx.activeBranchId);
  const lowStock = items.filter((item) => item.quantityOnHand <= item.reorderLevel);
  const outOfStock = items.filter((item) => item.quantityOnHand <= 0);
  const stockValueMinor = Math.round(items.reduce((sum, item) => sum + item.quantityOnHand * item.averageUnitCostMinor, 0));

  return (
    <main className="min-h-screen bg-paper text-ink transition-colors dark:bg-ink dark:text-paper">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <PageHeading eyebrow="Inventory · Branch stock" title="Stock list" description="See what is on hand at this branch, act on low stock, and move into the auditable ledger when you need the full story." actions={<><Button href="/inventory/new">Add stock</Button><Button href="/inventory/ledger" variant="secondary">View ledger</Button></>} />
        <InventorySectionNav />

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Inventory summary">
          <MetricCard label="Stock items" value={String(items.length)} icon="▤" hint="Tracked at this branch" />
          <MetricCard label="Low stock" value={String(lowStock.length)} icon="!" hint={lowStock.length ? "Needs purchasing attention" : "All items above reorder level"} />
          <MetricCard label="Out of stock" value={String(outOfStock.length)} icon="×" hint={outOfStock.length ? "Restock before service" : "No stock-outs recorded"} />
          <MetricCard label="Stock value" value={formatMoney(stockValueMinor)} icon="↗" hint="Based on average unit cost" />
        </section>

        <section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-ink-line/15 p-5 dark:border-ink-line sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">On hand</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Ingredient health</h2><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Quantities are a live summary; every change is recorded in the stock ledger.</p></div>
              <Badge tone={lowStock.length ? "warning" : "success"}>{lowStock.length ? `${lowStock.length} to review` : "Stock healthy"}</Badge>
            </div>

            {items.length ? <>
              <div className="divide-y divide-ink-line/10 dark:divide-ink-line sm:hidden">
                {items.map((item) => {
                  const health = stockHealth(item.quantityOnHand, item.reorderLevel);
                  return <div key={String(item._id)} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><b className="block truncate text-sm text-ink dark:text-paper">{item.name}</b><p className="mt-1 text-xs text-ink/50 dark:text-paper/55">Reorder at {formatQuantity(item.reorderLevel)} {item.unit}</p></div><Badge tone={health.tone}>{health.label}</Badge></div><div className="mt-4 flex items-end justify-between"><p className="font-display text-2xl text-ink dark:text-paper">{formatQuantity(item.quantityOnHand)} <span className="text-sm font-normal">{item.unit}</span></p><p className="text-xs text-ink/50 dark:text-paper/55">{item.averageUnitCostMinor ? formatMoney(item.averageUnitCostMinor) : "No cost yet"}</p></div></div>;
                })}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/50 dark:border-ink-line dark:bg-ink dark:text-paper/50"><tr><th className="px-5 py-3 font-medium">Ingredient</th><th className="px-4 py-3 font-medium">On hand</th><th className="px-4 py-3 font-medium">Stock health</th><th className="px-4 py-3 font-medium">Reorder at</th><th className="px-5 py-3 text-right font-medium">Average cost</th></tr></thead>
                  <tbody>{items.map((item) => {
                    const health = stockHealth(item.quantityOnHand, item.reorderLevel);
                    const progress = item.reorderLevel > 0 ? Math.min(100, Math.max(0, Math.round((item.quantityOnHand / item.reorderLevel) * 50))) : 100;
                    return <tr key={String(item._id)} className="border-b border-ink-line/10 last:border-0 dark:border-ink-line"><td className="px-5 py-4"><b className="block font-medium text-ink dark:text-paper">{item.name}</b><small className="mt-1 block text-xs text-ink/45 dark:text-paper/50">{item.unit} · Ledger tracked</small></td><td className="px-4 py-4 font-medium tabular-nums text-ink dark:text-paper">{formatQuantity(item.quantityOnHand)} {item.unit}</td><td className="px-4 py-4"><div className="flex items-center gap-3"><div className="h-2 w-20 overflow-hidden rounded-full bg-paper-dim dark:bg-paper/10"><span className={`block h-full rounded-full ${health.tone === "danger" ? "bg-status-cancelled" : health.tone === "warning" ? "bg-status-preparing" : "bg-status-ready"}`} style={{ width: `${progress}%` }} /></div><Badge tone={health.tone}>{health.label}</Badge></div></td><td className="px-4 py-4 tabular-nums text-ink/60 dark:text-paper/65">{formatQuantity(item.reorderLevel)} {item.unit}</td><td className="px-5 py-4 text-right tabular-nums text-ink/65 dark:text-paper/70">{item.averageUnitCostMinor ? formatMoney(item.averageUnitCostMinor) : "—"}</td></tr>;
                  })}</tbody>
                </table>
              </div>
            </> : <div className="p-6"><EmptyState icon="▤" title="Start your stock list" description="Add the ingredients your restaurant uses, then record their opening balances and later movements." action={<Button href="/inventory/new">Add stock</Button>} /></div>}
          </Card>

          <div className="space-y-5">
            <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Attention needed</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Low-stock alerts</h2>{lowStock.length ? <div className="mt-4 space-y-2">{lowStock.slice(0, 6).map((item) => <div key={String(item._id)} className="flex items-center justify-between gap-3 rounded-lg bg-amber-50 px-3 py-3 dark:bg-amber-400/10"><span className="min-w-0"><b className="block truncate text-sm text-ink dark:text-paper">{item.name}</b><small className="mt-1 block text-xs text-ink/55 dark:text-paper/60">Reorder at {formatQuantity(item.reorderLevel)} {item.unit}</small></span><span className="shrink-0 text-right text-sm font-semibold text-amber-700 dark:text-amber-200">{formatQuantity(item.quantityOnHand)}<small className="ml-1 text-xs font-normal">{item.unit}</small></span></div>)}</div> : <p className="mt-4 text-sm leading-6 text-ink/55 dark:text-paper/60">No ingredients are at or below their reorder level.</p>}</Card>
            <Card className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Next step</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Record stock safely</h2><p className="mt-2 text-sm leading-6 text-ink/55 dark:text-paper/60">New balances, adjustments, returns, and waste all go through a permanent movement record.</p><Button href="/inventory/new" variant="secondary" className="mt-5 w-full">Open new stock</Button></Card>
          </div>
        </section>
      </div>
    </main>
  );
}
