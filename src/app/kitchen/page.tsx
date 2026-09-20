import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { OrderRepository } from "@/repositories/order.repository";
import { TableModel } from "@/models/Table";
import { OrganizationModel } from "@/models/Organization";
import { KitchenBoard } from "./KitchenBoard";

export default async function KitchenPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.KITCHEN_ACCESS);
  if (!ctx.activeBranchId) return <div className="p-6 text-sm text-white/65">Choose a branch in the restaurant workspace before opening Kitchen Display.</div>;

  const [orders, tables, organization] = await Promise.all([
    OrderRepository.listByStatus({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }, ["PLACED", "CONFIRMED", "PREPARING", "READY"]),
    TableModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }).select("label").lean(),
    OrganizationModel.findById(ctx.organizationId).select("settings.kitchenStations").lean(),
  ]);
  const tableLabels = new Map(tables.map((table) => [String(table._id), table.label]));
  const stations = organization?.settings?.kitchenStations?.filter(Boolean) ?? ["Kitchen"];
  const fallbackStatus = (status: string) => status === "READY" ? "READY" : status === "PREPARING" ? "PREPARING" : "NEW" as const;

  return <KitchenBoard
    stations={stations}
    initialOrders={orders.map((order) => ({
      id: String(order._id), orderNumber: order.orderNumber, status: order.status,
      tableLabel: order.tableId ? tableLabels.get(String(order.tableId)) ?? "Table" : undefined,
      orderType: order.orderType, createdAt: order.createdAt.toISOString(),
      items: order.items.map((item) => ({
        id: String(item._id), name: item.nameSnapshot, quantity: item.quantity, notes: item.notes ?? undefined,
        kitchenStation: item.kitchenStation ?? "Kitchen", kitchenStatus: item.kitchenStatus ?? fallbackStatus(order.status),
        kitchenStartedAt: item.kitchenStartedAt?.toISOString(), kitchenReadyAt: item.kitchenReadyAt?.toISOString(),
      })),
    }))}
  />;
}
