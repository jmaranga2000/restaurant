import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { connectToDatabase } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { CustomerModel } from "@/models/Customer";
import { OrganizationModel } from "@/models/Organization";
import { OrderModel } from "@/models/Order";
import { TableModel } from "@/models/Table";
import { loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import type { OrderStatus } from "@/types/order";
import { OrderPaymentPanel } from "./OrderPaymentPanel";

const toneByStatus: Partial<Record<OrderStatus, "neutral" | "info" | "success" | "warning" | "danger">> = { DRAFT: "neutral", PLACED: "warning", CONFIRMED: "info", PREPARING: "info", READY: "success", SERVED: "success", COLLECTED: "success", COMPLETED: "success", CANCELLED: "danger", VOIDED: "danger", REFUNDED: "danger" };
function formatMoney(value: number, currency: string) { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100); }
function labelForStatus(status: string) { return status.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export default async function CashierOrdersPage() {
  const ctx = await loadAuthContext(await requireSession());
  requirePermissions(ctx, PERMISSIONS.POS_ACCESS, PERMISSIONS.ORDERS_VIEW);
  if (!ctx.activeBranchId) return <div className="p-4 sm:p-6 lg:p-8"><EmptyState icon="⌖" title="Choose a branch first" description="Orders are tied to a specific branch. Ask an administrator to assign your branch if it is missing." /></div>;
  requireBranchAccess(ctx, ctx.activeBranchId);
  await connectToDatabase();
  const [orders, customers, tables, organization] = await Promise.all([
    OrderModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }).sort({ updatedAt: -1 }).limit(80).lean(),
    CustomerModel.find({ organizationId: ctx.organizationId }).select("name").lean(),
    TableModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }).select("label").lean(),
    OrganizationModel.findById(ctx.organizationId).select("settings defaultCurrency").lean(),
  ]);
  const customerNames = new Map(customers.map((customer) => [String(customer._id), customer.name]));
  const tableLabels = new Map(tables.map((table) => [String(table._id), table.label]));
  const configured = organization?.settings?.paymentMethods?.flatMap((method) => method.enabled && method.code ? [{ code: method.code, label: method.label || method.code }] : []) ?? [];
  const paymentMethods = configured.length ? configured : [{ code: "CASH", label: "Cash" }, { code: "MPESA", label: "M-Pesa" }, { code: "CARD", label: "Card" }, { code: "BANK", label: "Bank" }, { code: "OTHER", label: "Other" }];
  const eligibleOrders = orders.filter((order) => !["CANCELLED", "VOIDED", "REFUNDED"].includes(order.status));
  const pendingOrders = eligibleOrders.filter((order) => order.payments.reduce((total, payment) => total + payment.amountMinor, 0) < order.totalMinor);
  const completedOrders = eligibleOrders.filter((order) => order.payments.reduce((total, payment) => total + payment.amountMinor, 0) >= order.totalMinor);
  const renderOrder = (order: (typeof orders)[number], completed: boolean) => {
    const paidMinor = order.payments.reduce((total, payment) => total + payment.amountMinor, 0);
    const balanceMinor = Math.max(0, order.totalMinor - paidMinor);
    const customerName = order.customerId ? customerNames.get(String(order.customerId)) : undefined;
    const tableLabel = order.tableId ? tableLabels.get(String(order.tableId)) : undefined;
    return <details key={String(order._id)} className="group border-b border-ink-line/10 px-4 py-4 last:border-0 dark:border-ink-line sm:px-5"><summary className="flex cursor-pointer list-none flex-wrap items-center gap-3"><span className="grid h-9 w-12 place-items-center rounded-lg bg-indigo-50 text-xs font-semibold text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200">#{order.orderNumber}</span><span className="min-w-[9rem] flex-1"><b className="block text-sm text-ink dark:text-paper">{customerName ?? "Walk-in guest"}</b><small className="mt-1 block text-xs text-ink/50 dark:text-paper/55">{tableLabel ?? order.orderType.replace("_", " ")}</small></span><Badge tone={completed ? "success" : toneByStatus[order.status as OrderStatus] ?? "warning"}>{completed ? "Paid" : labelForStatus(order.status)}</Badge><span className="ml-auto text-right"><b className="block text-sm text-ink dark:text-paper">{formatMoney(order.totalMinor, order.currency)}</b><small className={`mt-1 block text-xs ${balanceMinor ? "text-amber-700 dark:text-amber-200" : "text-emerald-700 dark:text-emerald-300"}`}>{balanceMinor ? `${formatMoney(balanceMinor, order.currency)} due` : "Paid"}</small></span><span className="text-ink/45 transition-transform group-open:rotate-90 dark:text-paper/45" aria-hidden="true">›</span></summary><div className="mt-4 border-t border-ink-line/10 pt-4 dark:border-ink-line"><div className="grid gap-4 text-sm sm:grid-cols-[1fr_auto]"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-ink/45 dark:text-paper/45">Items</p><div className="mt-2 space-y-1.5">{order.items.map((item) => <p key={String(item._id)} className="text-ink/70 dark:text-paper/75"><span className="mr-2 text-ink/45 dark:text-paper/45">{item.quantity}×</span>{item.nameSnapshot}</p>)}</div>{order.notes ? <p className="mt-3 rounded-lg bg-paper-dim px-3 py-2 text-xs text-ink/60 dark:bg-ink dark:text-paper/65">Note: {order.notes}</p> : null}</div><div className="min-w-52 rounded-lg bg-paper-dim p-3 text-xs dark:bg-ink"><p className="font-semibold text-ink dark:text-paper">Payment summary</p><p className="mt-2 flex justify-between text-ink/60 dark:text-paper/65"><span>Paid</span><span>{formatMoney(paidMinor, order.currency)}</span></p><p className="mt-1 flex justify-between font-semibold text-ink dark:text-paper"><span>Balance</span><span>{formatMoney(balanceMinor, order.currency)}</span></p>{order.payments.map((payment, index) => <p key={`${payment.method}-${index}`} className="mt-2 flex justify-between text-ink/50 dark:text-paper/55"><span>{payment.method}</span><span>{formatMoney(payment.amountMinor, order.currency)}</span></p>)}</div></div>{!completed ? <OrderPaymentPanel orderId={String(order._id)} balanceMinor={balanceMinor} currency={order.currency} paymentMethods={paymentMethods} /> : null}</div></details>;
  };

  return <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Cashier portal" title="Orders" description="New sales arrive in Pending. When the customer pays, the order moves to Completed." actions={<Button href="/pos/register">Open register <span aria-hidden="true">→</span></Button>} /><section className="mt-6 grid gap-3 sm:grid-cols-3"><MetricCard label="Pending payment" value={String(pendingOrders.length)} icon="◷" hint="Orders still awaiting payment" /><MetricCard label="Completed orders" value={String(completedOrders.length)} icon="✓" hint="Fully paid orders" /><MetricCard label="Ready to serve" value={String(pendingOrders.filter((order) => order.status === "READY").length)} icon="▣" hint="Paid at the counter when ready" /></section><section className="mt-6 grid gap-5 xl:grid-cols-2"><Card className="overflow-hidden"><div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[.14em] text-amber-700 dark:text-amber-200">Pending orders</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Awaiting customer payment</h2></div>{pendingOrders.length ? <div>{pendingOrders.map((order) => renderOrder(order, false))}</div> : <div className="p-6"><EmptyState icon="◷" title="No pending orders" description="Orders created from the register will appear here until payment is recorded." action={<Button href="/pos/register">Create order</Button>} /></div>}</Card><Card className="overflow-hidden"><div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><p className="text-xs font-semibold uppercase tracking-[.14em] text-emerald-700 dark:text-emerald-200">Completed orders</p><h2 className="mt-1 font-display text-xl text-ink dark:text-paper">Paid and settled</h2></div>{completedOrders.length ? <div>{completedOrders.map((order) => renderOrder(order, true))}</div> : <div className="p-6"><EmptyState icon="✓" title="No completed orders" description="When a pending order is paid in full, it will move into this section." /></div>}</Card></section></main>;
}
