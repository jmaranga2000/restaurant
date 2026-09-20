import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { OrganizationModel } from "@/models/Organization";
import { OrderModel } from "@/models/Order";
import Link from "next/link";

export default async function KitchenStationsPage() {
  const session = await requireSession(); const ctx = await loadAuthContext(session); requirePermissions(ctx, PERMISSIONS.KITCHEN_ACCESS);
  const [organization, orders] = await Promise.all([
    OrganizationModel.findById(ctx.organizationId).select("settings.kitchenStations").lean(),
    ctx.activeBranchId ? OrderModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId, status: { $in: ["PLACED", "CONFIRMED", "PREPARING", "READY"] } }).select("items").lean() : [],
  ]);
  const stations = organization?.settings?.kitchenStations?.filter(Boolean) ?? ["Kitchen"];
  return <div className="p-4 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-indigo-300">Kitchen</p><h1 className="mt-1 text-2xl font-semibold">Stations</h1><p className="mt-1 text-sm text-white/55">Items route to the station configured on their menu item. One order can be active in multiple stations.</p><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{stations.map((station) => { const items = orders.flatMap((order) => order.items).filter((item) => (item.kitchenStation ?? "Kitchen").toLowerCase() === station.toLowerCase()); const working = items.filter((item) => item.kitchenStatus === "PREPARING").length; const ready = items.filter((item) => item.kitchenStatus === "READY").length; return <section key={station} className="rounded-xl border border-white/10 bg-[#081b2d] p-5"><div className="flex items-start justify-between"><span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-500/20 text-lg text-indigo-200">⌁</span><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" /></div><h2 className="mt-5 text-xl font-semibold">{station}</h2><p className="mt-1 text-sm text-white/55">{items.length} active item{items.length === 1 ? "" : "s"}</p><div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-lg bg-amber-400/10 p-3"><p className="text-xs text-amber-100/70">Preparing</p><p className="mt-1 text-xl font-semibold text-amber-200">{working}</p></div><div className="rounded-lg bg-emerald-400/10 p-3"><p className="text-xs text-emerald-100/70">Ready</p><p className="mt-1 text-xl font-semibold text-emerald-200">{ready}</p></div></div><Link href="/kitchen" className="mt-5 inline-block text-sm font-medium text-indigo-300 hover:underline">Open station view →</Link></section>; })}</div><Link href="/kitchen/settings" className="mt-6 inline-block rounded-lg border border-white/15 px-4 py-2 text-sm text-white/75 hover:bg-white/10">Manage stations</Link></div>;
}
