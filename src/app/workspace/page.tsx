import Link from "next/link";
import { Types } from "mongoose";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Chart } from "@/components/ui/Chart";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { requireSession } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { isOrgWideAccess, loadAuthContext } from "@/permissions/authorize";
import { DashboardService } from "@/services/dashboard.service";
import { BranchModel } from "@/models/Branch";
import { CustomerModel } from "@/models/Customer";
import { InventoryItemModel } from "@/models/InventoryItem";
import { OrderModel } from "@/models/Order";
import { UserModel } from "@/models/User";
import type { OrderStatus } from "@/types/order";

function money(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100);
}

const statusTone: Partial<Record<OrderStatus, "warning" | "info" | "success" | "danger" | "neutral">> = { PLACED: "warning", CONFIRMED: "info", PREPARING: "info", READY: "success", COMPLETED: "success", CANCELLED: "danger", REFUNDED: "danger", DRAFT: "neutral" };

export default async function WorkspaceDashboardPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  await connectToDatabase();
  const allBranches = !ctx.activeBranchId && isOrgWideAccess(ctx);
  const branchScope = ctx.activeBranchId ? { branchId: ctx.activeBranchId } : {};
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);

  const [branches, customers, lowStockItems, recentOrders, staff, branchRows] = await Promise.all([
    BranchModel.find({ organizationId: ctx.organizationId, isActive: true }).sort({ name: 1 }).lean(),
    CustomerModel.countDocuments({ organizationId: ctx.organizationId, isActive: true }),
    InventoryItemModel.find({ organizationId: ctx.organizationId, ...branchScope, $expr: { $lte: ["$quantityOnHand", "$reorderLevel"] } }).sort({ quantityOnHand: 1 }).limit(6).lean(),
    OrderModel.find({ organizationId: ctx.organizationId, ...branchScope }).sort({ createdAt: -1 }).limit(6).lean(),
    UserModel.find({ organizationId: ctx.organizationId, isActive: true, lastLoginAt: { $gte: startOfDay } }).select("name lastLoginAt").sort({ lastLoginAt: -1 }).limit(5).lean(),
    DashboardService.orgWideSummaryByBranch(ctx.organizationId),
  ]);

  const summary = allBranches ? null : await DashboardService.todaySummary(ctx.organizationId, ctx.activeBranchId!);
  const totalOrders = summary ? summary.ordersToday : branchRows.reduce((total, branch) => total + branch.ordersToday, 0);
  const totalRevenue = summary ? summary.revenueTodayMinor : branchRows.reduce((total, branch) => total + branch.revenueTodayMinor, 0);
  const averageOrder = summary ? summary.averageOrderValueMinor : totalOrders ? Math.round(totalRevenue / totalOrders) : 0;
  const pending = summary ? summary.pending : recentOrders.filter((order) => ["PLACED", "CONFIRMED"].includes(order.status)).length;
  const preparing = summary ? summary.preparing : recentOrders.filter((order) => order.status === "PREPARING").length;
  const ready = summary ? summary.ready : recentOrders.filter((order) => order.status === "READY").length;

  const topItems = await OrderModel.aggregate([
    { $match: { organizationId: new Types.ObjectId(ctx.organizationId), ...(ctx.activeBranchId ? { branchId: new Types.ObjectId(ctx.activeBranchId) } : {}), status: "COMPLETED", createdAt: { $gte: startOfDay } } },
    { $unwind: "$items" }, { $group: { _id: "$items.nameSnapshot", quantity: { $sum: "$items.quantity" }, revenueMinor: { $sum: { $multiply: ["$items.unitPriceMinor", "$items.quantity"] } } } }, { $sort: { quantity: -1 } }, { $limit: 5 },
  ]);

  const selectedBranch = branches.find((branch) => String(branch._id) === ctx.activeBranchId);
  const scopeName = allBranches ? "All branches" : selectedBranch?.name ?? "Selected branch";
  const chartValues = allBranches ? branchRows.map((branch) => branch.revenueTodayMinor) : [pending, preparing, ready, totalOrders];

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeading eyebrow={scopeName} title="How is your restaurant performing today?" description="Live sales, service, stock, and staff signals for the current operating day." actions={<><Button href="/pos">Open POS <span aria-hidden="true">→</span></Button><Button href="/kitchen" variant="secondary">Kitchen board</Button></>} />

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Today’s restaurant performance">
        <MetricCard label="Today’s sales" value={money(totalRevenue)} icon="↗" trend={totalRevenue > 0 ? "Revenue recorded today" : undefined} hint={scopeName} />
        <MetricCard label="Orders" value={totalOrders.toLocaleString()} icon="◷" hint="Completed orders today" />
        <MetricCard label="Average order" value={money(averageOrder)} icon="◎" hint="Completed-order average" />
        <MetricCard label="Customers" value={customers.toLocaleString()} icon="◉" hint="Active customer profiles" />
        <MetricCard label="Pending orders" value={pending.toLocaleString()} icon="!" hint="Placed or confirmed" />
        <MetricCard label="Low-stock items" value={lowStockItems.length.toLocaleString()} icon="△" hint="At or below reorder level" />
      </section>

      <section className="mt-6 grid gap-4 xl:grid-cols-5">
        <Card className="p-5 xl:col-span-3"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Sales activity</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">{allBranches ? "Revenue by branch" : "Today’s order flow"}</h2><p className="mt-2 text-sm text-ink/55 dark:text-paper/60">{allBranches ? "Compare current sales between your active branches." : "See what is moving through service right now."}</p></div><Badge tone={pending + preparing + ready > 0 ? "warning" : "success"}>{pending + preparing + ready > 0 ? `${pending + preparing + ready} in service` : "All clear"}</Badge></div><div className="mt-6 h-56 text-ink dark:text-paper"><Chart values={chartValues.length ? chartValues : [0]} label={allBranches ? "Revenue by branch" : "Order status activity"} /></div><div className="mt-3 grid gap-2 text-center text-xs text-ink/55 dark:text-paper/55" style={{ gridTemplateColumns: `repeat(${Math.max(Math.min(chartValues.length, 5), 1)}, minmax(0, 1fr))` }}>{allBranches ? branchRows.slice(0, 5).map((branch) => <span key={branch.branchId} className="truncate">{branch.branchCode}</span>) : <><span>Waiting</span><span>Cooking</span><span>Ready</span><span>Completed</span></>}</div></Card>
        <Card className="p-5 xl:col-span-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Today’s order status</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Service queue</h2><div className="mt-5 space-y-3"><div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-3 dark:bg-amber-400/10"><span className="text-sm text-ink dark:text-paper">Waiting</span><Badge tone="warning">{pending}</Badge></div><div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-3 dark:bg-indigo-400/10"><span className="text-sm text-ink dark:text-paper">Preparing</span><Badge tone="info">{preparing}</Badge></div><div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-3 dark:bg-emerald-400/10"><span className="text-sm text-ink dark:text-paper">Ready to serve</span><Badge tone="success">{ready}</Badge></div></div><Button href="/workspace/orders" variant="ghost" size="sm" className="mt-5 px-0">View all orders <span aria-hidden="true">→</span></Button></Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden"><div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Best-selling items</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Today’s favourites</h2></div>{topItems.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{topItems.map((item, index) => <div key={item._id} className="flex items-center gap-3 px-5 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{index + 1}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{item._id}</b><small className="mt-1 block text-xs text-ink/50 dark:text-paper/55">{item.quantity} sold</small></span><span className="text-xs font-medium text-ink dark:text-paper">{money(item.revenueMinor)}</span></div>)}</div> : <div className="p-5 text-sm text-ink/55 dark:text-paper/60">Completed sales will reveal your best-selling items here.</div>}</Card>
        <Card className="overflow-hidden"><div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Recent transactions</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Latest orders</h2></div>{recentOrders.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{recentOrders.map((order) => <Link key={String(order._id)} href="/workspace/orders" className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-paper-dim dark:hover:bg-ink-line"><span className="min-w-0 flex-1"><b className="block text-sm text-ink dark:text-paper">Order #{order.orderNumber}</b><small className="mt-1 block text-xs text-ink/50 dark:text-paper/55">{order.orderType.replace("_", " ")}</small></span><Badge tone={statusTone[order.status as OrderStatus] ?? "neutral"}>{order.status.replace("_", " ")}</Badge><span className="text-xs font-medium text-ink dark:text-paper">{money(order.totalMinor, order.currency)}</span></Link>)}</div> : <div className="p-5 text-sm text-ink/55 dark:text-paper/60">New orders will appear here as service begins.</div>}</Card>
        <Card className="overflow-hidden"><div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Low-stock alerts</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Stock to review</h2></div>{lowStockItems.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{lowStockItems.map((item) => <div key={String(item._id)} className="flex items-center gap-3 px-5 py-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-50 text-xs text-red-600 dark:bg-red-400/15 dark:text-red-200" aria-hidden="true">!</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{item.name}</b><small className="mt-1 block text-xs text-ink/50 dark:text-paper/55">Reorder at {item.reorderLevel} {item.unit}</small></span><span className="text-xs font-medium text-status-cancelled">{item.quantityOnHand} {item.unit}</span></div>)}</div> : <div className="p-5 text-sm text-ink/55 dark:text-paper/60">No low-stock items for this view.</div>}</Card>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-5"><Card className="p-5 lg:col-span-3"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Branch comparison</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">How each location is doing</h2>{branchRows.length ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="border-b border-ink-line/15 text-xs uppercase tracking-wide text-ink/50 dark:border-ink-line dark:text-paper/50"><tr><th className="pb-3 font-medium">Branch</th><th className="pb-3 font-medium">Orders</th><th className="pb-3 text-right font-medium">Sales</th></tr></thead><tbody>{branchRows.map((branch) => <tr key={branch.branchId} className="border-b border-ink-line/10 last:border-0 dark:border-ink-line"><td className="py-3 font-medium text-ink dark:text-paper">{branch.branchName}<small className="ml-2 text-xs font-normal text-ink/45 dark:text-paper/45">{branch.branchCode}</small></td><td className="py-3 tabular-nums text-ink/65 dark:text-paper/70">{branch.ordersToday}</td><td className="py-3 text-right font-medium tabular-nums text-ink dark:text-paper">{money(branch.revenueTodayMinor)}</td></tr>)}</tbody></table></div> : <p className="mt-4 text-sm text-ink/55 dark:text-paper/60">Create additional branches to compare their performance here.</p>}</Card><Card className="p-5 lg:col-span-2"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Staff activity</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Team online today</h2>{staff.length ? <div className="mt-5 space-y-3">{staff.map((user) => <div key={String(user._id)} className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{user.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{user.name}</b><small className="mt-1 block text-xs text-ink/50 dark:text-paper/55">Active today</small></span><span className="h-2 w-2 rounded-full bg-status-ready" aria-label="Active" /></div>)}</div> : <div className="mt-4"><EmptyState icon="◎" title="No staff activity yet" description="Team sign-ins will appear here during the day." /></div>}</Card></section>
    </div>
  );
}
