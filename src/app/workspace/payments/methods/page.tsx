import { requireSession } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { isOrgWideAccess, loadAuthContext, requireBranchAccess, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { OrderModel } from "@/models/Order";
import { BranchModel } from "@/models/Branch";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { PAYMENT_METHOD_CODES } from "@/types/order";

function money(value: number, currency = "KES") { return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100); }
function label(method: string) { return method === "MPESA" ? "M-Pesa" : method.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export default async function PaymentMethodsPage() {
  const ctx = await loadAuthContext(await requireSession());
  requirePermissions(ctx, PERMISSIONS.MANAGER_WORKSPACE_ACCESS, PERMISSIONS.ORDERS_VIEW);
  if (ctx.activeBranchId) requireBranchAccess(ctx, ctx.activeBranchId);
  await connectToDatabase();
  const organizationWide = isOrgWideAccess(ctx);
  const branchFilter = organizationWide ? {} : { _id: { $in: ctx.assignedBranchIds } };
  const branches = await BranchModel.find({ organizationId: ctx.organizationId, isActive: true, ...branchFilter }).select("_id name").lean();
  const orders = await OrderModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId ?? { $in: branches.map((branch) => branch._id) } }).select("currency payments").limit(1000).lean();
  const rows = PAYMENT_METHOD_CODES.map((method) => {
    const payments = orders.flatMap((order) => order.payments.filter((payment) => payment.method === method));
    const captured = payments.filter((payment) => payment.amountMinor > 0).reduce((sum, payment) => sum + payment.amountMinor, 0);
    const refunded = Math.abs(payments.filter((payment) => payment.amountMinor < 0).reduce((sum, payment) => sum + payment.amountMinor, 0));
    return { method, count: payments.length, captured, refunded, net: captured - refunded };
  });
  const totalNet = rows.reduce((sum, row) => sum + row.net, 0);
  const currency = orders[0]?.currency ?? "KES";
  return <main className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper"><div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Finance · Payments" title="Payment methods" description="Compare tender volume, refunds, and net settlement across the payment methods used by your branches." actions={<Button href="/workspace/payments" variant="secondary">Back to payments</Button>} /><Card className="mt-6 p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">Net settlement</p><h2 className="mt-1 font-display text-3xl text-ink dark:text-paper">{money(totalNet, currency)}</h2><p className="mt-2 text-sm text-ink/55 dark:text-paper/60">Captured less refunds across the loaded order history.</p></div><span className="text-xs text-ink/50 dark:text-paper/55">{orders.length} orders · {branches.length} branches</span></div></Card><section className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((row) => { const share = totalNet > 0 ? Math.round((row.net / totalNet) * 100) : 0; return <Card key={row.method} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-indigo-600 dark:text-indigo-300">{label(row.method)}</p><h2 className="mt-2 font-display text-2xl text-ink dark:text-paper">{money(row.net, currency)}</h2></div><span className="rounded-full bg-paper-dim px-2.5 py-1 text-xs text-ink/60 dark:bg-ink dark:text-paper/65">{share}%</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-paper-dim dark:bg-paper/10"><span className="block h-full rounded-full bg-indigo-600" style={{ width: `${Math.max(0, Math.min(100, share))}%` }} /></div><dl className="mt-5 grid grid-cols-3 gap-2 text-xs"><div><dt className="text-ink/45 dark:text-paper/50">Entries</dt><dd className="mt-1 font-semibold">{row.count}</dd></div><div><dt className="text-ink/45 dark:text-paper/50">Captured</dt><dd className="mt-1 font-semibold text-emerald-700 dark:text-emerald-300">{money(row.captured, currency)}</dd></div><div><dt className="text-ink/45 dark:text-paper/50">Refunded</dt><dd className="mt-1 font-semibold text-red-600 dark:text-red-300">{money(row.refunded, currency)}</dd></div></dl></Card>; })}</section>{!orders.length ? <div className="mt-5"><EmptyState icon="¤" title="No payment activity yet" description="Payment method performance will appear after the first POS payment is recorded." action={<Button href="/pos/register">Open register</Button>} /></div> : null}</div></main>;
}