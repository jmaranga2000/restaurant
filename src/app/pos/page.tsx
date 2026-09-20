import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { ProductRepository } from "@/repositories/product.repository";
import { PosClient } from "./PosClient";

export default async function PosPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.POS_ACCESS);

  const products = await ProductRepository.listByCategory(ctx.organizationId);

  const menu = products.map((p) => ({
    id: String(p._id),
    name: p.name,
    kitchenStation: p.kitchenStation ?? undefined,
    variants: p.variants.map((v) => ({ id: String(v._id), name: v.name, priceMinor: v.priceMinor, isDefault: v.isDefault })),
    modifierGroups: p.modifierGroups.map((g) => ({
      id: String(g._id),
      name: g.name,
      minSelect: g.minSelect,
      maxSelect: g.maxSelect,
      options: g.options.map((o) => ({ id: String(o._id), name: o.name, priceMinor: o.priceMinor })),
    })),
  }));

  return <PosClient menu={menu} branchId={ctx.activeBranchId} />;
}
