import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { connectToDatabase } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { CustomerModel } from "@/models/Customer";
import { OrderModel } from "@/models/Order";
import { TableModel } from "@/models/Table";
import { loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import type { OrderStatus } from "@/types/order";

const toneByStatus: Partial<Record<OrderStatus, "neutral" | "info" | "success" | "warning" | "danger">> = {
  DRAFT: "neutral",
  PLACED: "warning",
  CONFIRMED: "info",
  PREPARING: "info",
  READY: "success",
  SERVED: "success",
  COLLECTED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  VOIDED: "danger",
  REFUNDED: "danger",
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100);
}

function labelForStatus(status: string) {
  return status.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function CashierOrdersPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.POS_ACCESS, PERMISSIONS.ORDERS_VIEW);

  if (!ctx.activeBranchId) {
    return <div className="p-4 sm:p-6 lg:p-8"><EmptyState icon="⌖" title="Choose a branch first" description="Orders are tied to a specific branch. Ask an administrator to assign your branch if it is missing." /></div>;
  }

  requireBranchAccess(ctx, ctx.activeBranchId);
  await connectToDatabase();
  const [orders, customers, tables] = await Promise.all([
    OrderModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }).sort({ updatedAt: -1 }).limit(80).lean(),
    CustomerModel.find({ organizationId: ctx.organizationId }).select("name phone").lean(),
    TableModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }).select("label").lean(),
  ]);

  const customerNames = new Map(customers.map((customer) => [String(customer._id), customer.name]));
  const tableLabels = new Map(tables.map((table) => [String(table._id), table.label]));
  const activeOrders = orders.filter((order) => !["COMPLETED", "CANCELLED", "VOIDED", "REFUNDED"].includes(order.status));
  const readyOrders = orders.filter((order) => order.status === "READY");
  const paidOrders = orders.filter((order) => order.payments.reduce((total, payment) => total + payment.amountMinor, 0) >= order.totalMinor).length;

  return (
    <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
      <PageHeading eyebrow="Cashier portal" title="Orders" description="Track the branch service queue, payment progress, and recent ticket details." actions={<Button href="/pos">Open register <span aria-hidden="true">→</span></Button>} />
      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <MetricCard label="Active orders" value={String(activeOrders.length)} icon="◷" hint="In service right now" />
        <MetricCard label="Ready to serve" value={String(readyOrders.length)} icon="✓" hint="Awaiting collection or service" />
        <MetricCard label="Paid tickets" value={String(paidOrders)} icon="▣" hint="From the recent order list" />
      </section>

      <Card className="mt-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-line/15 p-5 dark:border-ink-line"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Branch queue</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Recent orders</h2></div><Badge tone={activeOrders.length ? "warning" : "success"}>{activeOrders.length ? `${activeOrders.length} active` : "All clear"}</Badge></div>
        {orders.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{orders.map((order) => {
          const paidMinor = order.payments.reduce((total, payment) => total + payment.amountMinor, 0);
          const balanceMinor = Math.max(0, order.totalMinor - paidMinor);
          const customerName = order.customerId ? customerNames.get(String(order.customerId)) : undefined;
          const tableLabel = order.tableId ? tableLabels.get(String(order.tableId)) : undefined;
          return <details key={String(order._id)} className="group px-4 py-4 sm:px-5"><summary className="flex cursor-pointer list-none flex-wrap items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200">#{order.orderNumber}</span><span className="min-w-[9rem] flex-1"><b className="block text-sm text-ink dark:text-paper">{customerName ?? "Walk-in guest"}</b><small className="mt-1 block text-xs text-ink/50 dark:text-paper/55">{tableLabel ?? order.orderType.replace("_", " ")}</small></span><Badge tone={toneByStatus[order.status as OrderStatus] ?? "neutral"}>{labelForStatus(order.status)}</Badge><span className="ml-auto text-right"><b className="block text-sm text-ink dark:text-paper">{formatMoney(order.totalMinor, order.currency)}</b><small className={`mt-1 block text-xs ${balanceMinor ? "text-amber-700 dark:text-amber-200" : "text-emerald-700 dark:text-emerald-300"}`}>{balanceMinor ? `${formatMoney(balanceMinor, order.currency)} due` : "Paid"}</small></span><span className="text-ink/45 transition-transform group-open:rotate-90 dark:text-paper/45" aria-hidden="true">›</span></summary><div className="mt-4 grid gap-4 border-t border-ink-line/10 pt-4 text-sm dark:border-ink-line sm:grid-cols-[1fr_auto]"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-ink/45 dark:text-paper/45">Items</p><div className="mt-2 space-y-1.5">{order.items.map((item) => <p key={String(item._id)} className="text-ink/70 dark:text-paper/75"><span className="mr-2 text-ink/45 dark:text-paper/45">{item.quantity}×</span>{item.nameSnapshot}</p>)}</div>{order.notes ? <p className="mt-3 rounded-lg bg-paper-dim px-3 py-2 text-xs text-ink/60 dark:bg-ink dark:text-paper/65">Note: {order.notes}</p> : null}</div><div className="min-w-48 rounded-lg bg-paper-dim p-3 text-xs dark:bg-ink"><p className="font-semibold text-ink dark:text-paper">Payment summary</p><p className="mt-2 flex justify-between text-ink/55 dark:text-paper/60"><span>Received</span><span>{formatMoney(paidMinor, order.currency)}</span></p><p className="mt-1 flex justify-between font-medium text-ink dark:text-paper"><span>Outstanding</span><span>{formatMoney(balanceMinor, order.currency)}</span></p><Link href="/pos" className="mt-3 inline-flex font-semibold text-indigo-700 hover:underline dark:text-indigo-300">Open in register →</Link></div></div></details>;
        })}</div> : <div className="p-5"><EmptyState icon="◷" title="No branch orders yet" description="New, held, and completed tickets will appear here as they are created at the register." action={<Button href="/pos">Open register</Button>} /></div>}
      </Card>
    </main>
  );
}
