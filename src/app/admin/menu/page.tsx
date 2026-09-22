import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { connectToDatabase } from "@/lib/db";
import { cloudinaryImageUrl } from "@/lib/cloudinary";
import { CategoryModel, ProductModel } from "@/models/Product";
import { MenuManager } from "./MenuManager";

export default async function AdminMenuPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);
  await connectToDatabase();
  const [categories, products] = await Promise.all([
    CategoryModel.find({ organizationId: ctx.organizationId, isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    ProductModel.find({ organizationId: ctx.organizationId }).sort({ updatedAt: -1 }).lean(),
  ]);
  const categoryNames = new Map(categories.map((category) => [String(category._id), category.name]));
  return <MenuManager
    mode="catalog"
    categories={categories.map((category) => ({ id: String(category._id), name: category.name }))}
    items={products.map((product) => ({
      id: String(product._id), name: product.name, description: product.description ?? "", categoryId: String(product.categoryId),
      category: categoryNames.get(String(product.categoryId)) ?? "Uncategorised", kitchenStation: product.kitchenStation ?? "",
      sku: product.sku ?? "", barcode: product.barcode ?? "", taxRatePercent: product.taxRatePercent ?? undefined,
      isAvailable: product.isAvailable ?? true, imageUrl: cloudinaryImageUrl(product.imagePublicId),
      variants: product.variants.map((variant) => ({ id: String(variant._id), name: variant.name, priceMinor: variant.priceMinor, isDefault: variant.isDefault ?? false })),
      modifierGroups: product.modifierGroups.map((group) => ({ id: String(group._id), name: group.name, minSelect: group.minSelect, maxSelect: group.maxSelect, options: group.options.map((option) => ({ id: String(option._id), name: option.name, priceMinor: option.priceMinor })) })),
    }))}
  />;
}
