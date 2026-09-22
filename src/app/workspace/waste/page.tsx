import { requireSession } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { InventoryService } from "@/services/inventory.service";
import { StockMovementModel } from "@/models/StockMovement";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { WasteForm } from "./WasteForm";
import { formatMoney, formatQuantity } from "@/app/inventory/inventory-helpers";

export default async function WastePage() {
  const ctx = await loadAuthContext(await requireSession());
  requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS, PERMISSIONS.INVENTORY_ADJUST);
  if (!ctx.activeBranchId) return <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Inventory" title="Choose a branch first" description="Waste is recorded against one branch at a time." actions={<Button href="/workspace" variant="secondary">Back to workspace</Button>} /><div className="mt-6"><EmptyState icon="×" title="No active branch selected" description="Select a branch from your workspace before recording waste." action={<Button href="/workspace">Open workspace</Button>} /></div></div>;
  requireBranchAccess(ctx, ctx.activeBranchId);
  await connectToDatabase();
  const items = await InventoryService.listForBranch(ctx, ctx.activeBranchId);
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
  const movements = await StockMovementModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId, type: "WASTE" }).sort({ createdAt: -1 }).limit(30).lean();
  const todayMovements = movements.filter((movement) => movement.createdAt >= startOfDay);
  const itemMap = new Map(items.map((item) => [String(item._id), item]));
  const todayQuantity = todayMovements.reduce((total, movement) => total + Math.abs(movement.quantity), 0);
  const todayCostMinor = todayMovements.reduce((total, movement) => total + Math.round(Math.abs(movement.quantity) * (itemMap.get(String(movement.inventoryItemId))?.averageUnitCostMinor ?? movement.unitCostMinor ?? 0)), 0);

  return <main className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper"><div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Inventory · Loss control" title="Waste" description="Record waste against the stock ledger and understand its cost before it disappears from your margin." actions={<><Button href="/inventory/ledger" variant="secondary">View stock ledger</Button><Button href="/inventory">Stock list</Button></>} /><section className="mt-6 grid gap-3 sm:grid-cols-3"><MetricCard label="Waste today" value={formatQuantity(todayQuantity)} icon="×" hint="Total quantity removed" /><MetricCard label="Estimated cost today" value={formatMoney(todayCostMinor)} icon="↘" hint="Using average unit cost" /><MetricCard label="Recorded entries" value={String(todayMovements.length)} icon="◷" hint="Waste movements today" /></section><section className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(330px,420px)]"><WasteForm branchId={ctx.activeBranchId} items={items.map((item) => ({ id: String(item._id), name: item.name, unit: item.unit, quantityOnHand: item.quantityOnHand, averageUnitCostMinor: item.averageUnitCostMinor }))} /><Card className="overflow-hidden"><div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Recent waste</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Latest loss entries</h2></div>{movements.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{movements.slice(0, 10).map((movement) => { const item = itemMap.get(String(movement.inventoryItemId)); const cost = Math.round(Math.abs(movement.quantity) * (item?.averageUnitCostMinor ?? movement.unitCostMinor ?? 0)); return <div key={String(movement._id)} className="p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><b className="block truncate text-sm text-ink dark:text-paper">{item?.name ?? "Inventory item"}</b><p className="mt-1 text-xs text-ink/50 dark:text-paper/55">{formatQuantity(Math.abs(movement.quantity))} {item?.unit ?? "units"}</p></div><Badge tone="danger">{formatMoney(cost)}</Badge></div><p className="mt-2 text-xs text-ink/55 dark:text-paper/60">{movement.note || "No reason recorded"}</p><time className="mt-2 block text-[11px] text-ink/45 dark:text-paper/50">{new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(movement.createdAt)}</time></div>; })}</div> : <div className="p-6"><EmptyState icon="×" title="No waste recorded" description="Your waste entries will appear here with quantity, reason, and estimated cost." /></div>}</Card></section></div></main>;
}