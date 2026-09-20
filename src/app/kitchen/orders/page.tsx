import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { OrderModel } from "@/models/Order";
import { TableModel } from "@/models/Table";
import { Badge } from "@/components/ui/Badge";

const groups = [
  { title: "Active", statuses: ["PLACED", "CONFIRMED", "PREPARING", "READY"], tone: "info" as const },
  { title: "Completed", statuses: ["SERVED", "COMPLETED"], tone: "success" as const },
  { title: "Cancelled", statuses: ["CANCELLED", "VOIDED", "REFUNDED"], tone: "danger" as const },
];

export default async function KitchenOrdersPage() {
  const session = await requireSession(); const ctx = await loadAuthContext(session); requirePermissions(ctx, PERMISSIONS.KITCHEN_ACCESS);
  if (!ctx.activeBranchId) return <div className="p-6 text-sm text-white/60">Choose a branch to review kitchen orders.</div>;
  const [orders, tables] = await Promise.all([
    OrderModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }).sort({ createdAt: -1 }).limit(120).lean(),
    TableModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }).select("label").lean(),
  ]);
  const tableLabels = new Map(tables.map((table) => [String(table._id), table.label]));
  return <div className="p-4 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-indigo-300">Kitchen</p><h1 className="mt-1 text-2xl font-semibold">Orders</h1><p className="mt-1 text-sm text-white/55">A complete kitchen-facing view of active, completed, and cancelled orders.</p><div className="mt-6 grid gap-4 xl:grid-cols-3">{groups.map((group) => { const rows = orders.filter((order) => group.statuses.includes(order.status)); return <section key={group.title} className="rounded-xl border border-white/10 bg-[#081b2d]"><div className="flex items-center justify-between border-b border-white/10 p-4"><h2 className="font-semibold">{group.title}</h2><Badge tone={group.tone}>{rows.length}</Badge></div><div className="max-h-[65vh] space-y-2 overflow-y-auto p-3">{rows.map((order) => <article key={String(order._id)} className="rounded-lg border border-white/10 bg-[#0b2338] p-3"><div className="flex justify-between"><b className="font-mono">#{order.orderNumber}</b><Badge tone={group.tone}>{order.status}</Badge></div><p className="mt-1 text-xs text-white/55">{order.tableId ? tableLabels.get(String(order.tableId)) ?? "Table" : order.orderType.replaceAll("_", " ")} · {new Intl.DateTimeFormat("en-KE", { hour: "2-digit", minute: "2-digit" }).format(order.createdAt)}</p><div className="mt-3 space-y-1 text-sm text-white/80">{order.items.map((item) => <p key={String(item._id)}>{item.quantity} × {item.nameSnapshot} <span className="text-xs text-white/40">· {item.kitchenStation ?? "Kitchen"}</span></p>)}</div></article>)}{!rows.length ? <p className="p-6 text-center text-sm text-white/35">No {group.title.toLowerCase()} orders.</p> : null}</div></section>; })}</div></div>;
}
