import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { MetricCard } from "@/components/ui/MetricCard";
import { PageHeading } from "@/components/ui/PageHeading";
import { connectToDatabase } from "@/lib/db";
import { requirePlatformSession } from "@/lib/platform-session";
import { BranchModel } from "@/models/Branch";
import { OrderModel } from "@/models/Order";
import { OrganizationModel } from "@/models/Organization";

const activeOrderStatuses = ["PLACED", "CONFIRMED", "PREPARING", "READY"];

type StationLoad = { organizationId: string; branchId: string; station: string; newItems: number; preparing: number; ready: number };

export default async function SuperAdminKitchensPage() {
  await requirePlatformSession();
  await connectToDatabase();
  const activeOrders = await OrderModel.find({ status: { $in: activeOrderStatuses } }).select("organizationId branchId orderNumber status items createdAt").sort({ updatedAt: -1 }).limit(1000).lean();
  const stationLoads = new Map<string, StationLoad>();
  let newItems = 0;
  let preparingItems = 0;
  let readyItems = 0;

  for (const order of activeOrders) {
    for (const item of order.items) {
      const kitchenStatus = item.kitchenStatus ?? (order.status === "READY" ? "READY" : order.status === "PREPARING" ? "PREPARING" : "NEW");
      if (kitchenStatus === "COMPLETED") continue;
      const station = item.kitchenStation?.trim() || "Kitchen";
      const key = `${order.organizationId}:${order.branchId}:${station.toLowerCase()}`;
      const load = stationLoads.get(key) ?? { organizationId: String(order.organizationId), branchId: String(order.branchId), station, newItems: 0, preparing: 0, ready: 0 };
      if (kitchenStatus === "PREPARING") { load.preparing += item.quantity; preparingItems += item.quantity; }
      else if (kitchenStatus === "READY") { load.ready += item.quantity; readyItems += item.quantity; }
      else { load.newItems += item.quantity; newItems += item.quantity; }
      stationLoads.set(key, load);
    }
  }

  const loads = [...stationLoads.values()].sort((left, right) => right.newItems + right.preparing + right.ready - left.newItems - left.preparing - left.ready);
  const organizationIds = [...new Set(loads.map((load) => load.organizationId))];
  const branchIds = [...new Set(loads.map((load) => load.branchId))];
  const [organizations, branches] = await Promise.all([
    organizationIds.length ? OrganizationModel.find({ _id: { $in: organizationIds } }).select("name").lean() : [],
    branchIds.length ? BranchModel.find({ _id: { $in: branchIds } }).select("name").lean() : [],
  ]);
  const organizationNames = new Map(organizations.map((organization) => [String(organization._id), organization.name]));
  const branchNames = new Map(branches.map((branch) => [String(branch._id), branch.name]));

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-paper p-4 text-ink dark:bg-ink dark:text-paper sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <PageHeading eyebrow="Operations · Preparation" title="Kitchens" description="View active kitchen ticket load by restaurant, branch, and preparation station." />
        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Active tickets" value={activeOrders.length.toLocaleString()} icon="♨" hint="Latest active orders loaded" />
          <MetricCard label="New item quantity" value={newItems.toLocaleString()} icon="●" hint="Waiting to start preparation" />
          <MetricCard label="Preparing quantity" value={preparingItems.toLocaleString()} icon="◷" hint="Currently in preparation" />
          <MetricCard label="Ready quantity" value={readyItems.toLocaleString()} icon="✓" hint="Ready for service" />
        </section>
        <Card className="mt-6 overflow-hidden">
          <div className="border-b border-ink-line/15 p-5 dark:border-ink-line"><h2 className="font-display text-xl text-ink dark:text-paper">Station workload</h2><p className="mt-1 text-sm text-ink/55 dark:text-paper/60">Load is calculated from active order item quantities.</p></div>
          {loads.length ? <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/55 dark:border-ink-line dark:bg-ink dark:text-paper/55"><tr><th className="px-5 py-3 font-medium">Organization</th><th className="px-3 py-3 font-medium">Branch</th><th className="px-3 py-3 font-medium">Station</th><th className="px-3 py-3 font-medium">New</th><th className="px-3 py-3 font-medium">Preparing</th><th className="px-5 py-3 font-medium">Ready</th></tr></thead>
            <tbody>{loads.slice(0, 200).map((load) => <tr key={`${load.organizationId}-${load.branchId}-${load.station}`} className="border-b border-ink-line/10 last:border-0"><td className="px-5 py-4 font-medium text-ink dark:text-paper">{organizationNames.get(load.organizationId) ?? "Unknown organization"}</td><td className="px-3 py-4">{branchNames.get(load.branchId) ?? "Unknown branch"}</td><td className="px-3 py-4"><Badge tone="info">{load.station}</Badge></td><td className="px-3 py-4">{load.newItems}</td><td className="px-3 py-4">{load.preparing}</td><td className="px-5 py-4">{load.ready}</td></tr>)}</tbody>
          </table></div> : <div className="p-6"><EmptyState icon="♨" title="No active kitchen tickets" description="Orders with active preparation items will appear here by station." /></div>}
        </Card>
      </div>
    </div>
  );
}