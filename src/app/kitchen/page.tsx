import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { OrderRepository } from "@/repositories/order.repository";
import { KitchenBoard } from "./KitchenBoard";

export default async function KitchenPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.KITCHEN_ACCESS);

  if (!ctx.activeBranchId) {
    return <div className="p-8 text-ink/70">Select a branch to open its kitchen display.</div>;
  }

  const orders = await OrderRepository.listByStatus(
    { organizationId: ctx.organizationId, branchId: ctx.activeBranchId },
    ["PLACED", "CONFIRMED", "PREPARING", "READY"]
  );

  const boardOrders = orders.map((o) => ({
    id: String(o._id),
    orderNumber: o.orderNumber,
    status: o.status,
    items: o.items.map((i) => ({ name: i.nameSnapshot, quantity: i.quantity, notes: i.notes ?? undefined })),
    createdAt: o.createdAt.toISOString(),
  }));

  return <KitchenBoard initialOrders={boardOrders} />;
}
