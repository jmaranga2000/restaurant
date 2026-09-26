import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { connectToDatabase } from "@/lib/db";
import { requirePlatformSession } from "@/lib/platform-session";
import { BranchModel } from "@/models/Branch";
import { OrderModel } from "@/models/Order";
import { OrganizationModel } from "@/models/Organization";

function money(amountMinor: number, currency: string) {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(amountMinor / 100);
}

function statusTone(status: string) {
  if (["COMPLETED", "SERVED", "COLLECTED"].includes(status)) return "success" as const;
  if (["CANCELLED", "VOIDED", "REFUNDED"].includes(status)) return "danger" as const;
  if (["READY", "PREPARING"].includes(status)) return "info" as const;
  if (status === "DRAFT") return "neutral" as const;
  return "warning" as const;
}

export default async function SuperAdminOrdersPage() {
  await requirePlatformSession();
  await connectToDatabase();
  const [orders, statusCounts] = await Promise.all([
    OrderModel.find().sort({ createdAt: -1 }).limit(100).lean(),
    OrderModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
  ]);
  const countByStatus = new Map(statusCounts.map((entry) => [String(entry._id), entry.count as number]));
  const totalOrders = statusCounts.reduce((sum, entry) => sum + (entry.count as number), 0);
  const activeStatuses = ["DRAFT", "PLACED", "CONFIRMED", "PREPARING", "READY", "SERVED", "COLLECTED", "OUT_FOR_DELIVERY"];
  const activeOrders = activeStatuses.reduce((sum, status) => sum + (countByStatus.get(status) ?? 0), 0);
  const completedOrders = ["COMPLETED", "SERVED", "COLLECTED"].reduce((sum, status) => sum + (countByStatus.get(status) ?? 0), 0);
  const organizationIds = [...new Set(orders.map((order) => String(order.organizationId)))];
  const branchIds = [...new Set(orders.map((order) => String(order.branchId)))];
  const [organizations, branches] = await Promise.all([
    organizationIds.length ? OrganizationModel.find({ _id: { $in: organizationIds } }).select("name").lean() : [],
    branchIds.length ? BranchModel.find({ _id: { $in: branchIds } }).select("name").lean() : [],
  ]);
  const organizationNames = new Map(organizations.map((organization) => [String(organization._id), organization.name]));
  const branchNames = new Map(branches.map((branch) => [String(branch._id), branch.name]));

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading eyebrow="Operations · Service" title="Orders" description="Monitor order volume and status across every restaurant organization." actions={<Button href="/super-admin/organizations" variant="secondary" size="sm">Organizations</Button>} />
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <MetricCard label="All orders" value={totalOrders.toLocaleString()} icon="◷" hint="Across the platform" />
          <MetricCard label="In service" value={activeOrders.toLocaleString()} icon="⌁" hint="Open, preparing, or awaiting service" />
          <MetricCard label="Completed" value={completedOrders.toLocaleString()} icon="✓" hint="Served or settled orders" />
        </section>
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><h2 className="font-display text-xl text-ink dark:text-paper">Latest platform orders</h2><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Showing the latest {orders.length} records.</p></div>
          {orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/55 dark:border-ink-line dark:bg-ink dark:text-paper/55"><tr><th className="px-5 py-3 font-medium">Order</th><th className="px-3 py-3 font-medium">Organization</th><th className="px-3 py-3 font-medium">Branch</th><th className="px-3 py-3 font-medium">Service</th><th className="px-3 py-3 font-medium">Total</th><th className="px-3 py-3 font-medium">Status</th><th className="px-5 py-3 font-medium">Created</th></tr></thead>
            <tbody>{orders.map((order) => <tr key={String(order._id)} className="border-b border-ink-line/10 last:border-0">
              <td className="px-5 py-4 font-medium text-ink dark:text-paper">#{order.orderNumber}<small className="mt-1 block text-xs font-normal text-ink/45 dark:text-paper/50">{order.items.length} item{order.items.length === 1 ? "" : "s"}</small></td>
              <td className="px-3 py-4">{organizationNames.get(String(order.organizationId)) ?? "Unknown organization"}</td>
              <td className="px-3 py-4">{branchNames.get(String(order.branchId)) ?? "Unknown branch"}</td>
              <td className="px-3 py-4 text-xs text-ink/60 dark:text-paper/65">{order.orderType.replaceAll("_", " ")}</td>
              <td className="px-3 py-4 font-medium">{money(order.totalMinor, order.currency)}</td>
              <td className="px-3 py-4"><Badge tone={statusTone(order.status)}>{order.status.replaceAll("_", " ")}</Badge></td>
              <td className="px-5 py-4 text-xs text-ink/55 dark:text-paper/60">{new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(order.createdAt)}</td>
            </tr>)}</tbody>
          </table></div> : <div className="p-6"><EmptyState icon="◷" title="No orders yet" description="Orders from restaurant branches will appear here as they are created." /></div>}
        </Card>
      </div>
    </div>
  );
}