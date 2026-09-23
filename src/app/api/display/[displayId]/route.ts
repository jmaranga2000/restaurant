import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { cloudinaryImageUrl } from "@/lib/cloudinary";
import { BranchModel } from "@/models/Branch";
import { OrderModel } from "@/models/Order";
import { CategoryModel, ProductModel } from "@/models/Product";
import { TableModel } from "@/models/Table";

export const dynamic = "force-dynamic";

function isReadyForDisplay(order: { status: string; items: { kitchenStatus?: string | null }[] }) {
  return order.status === "READY" || order.status === "SERVED" || (
    order.items.length > 0 && order.items.every((item) => item.kitchenStatus === "READY" || item.kitchenStatus === "COMPLETED")
  );
}

function isVisibleOnDisplay(order: { status: string; updatedAt: Date }) {
  return order.status !== "SERVED" || Date.now() - order.updatedAt.getTime() < 10 * 60 * 1000;
}

/** Public, display-scoped feed. It contains only the information a guest TV needs. */
export async function GET(_request: Request, { params }: { params: { displayId: string } }) {
  await connectToDatabase();
  const branch = await BranchModel.findOne({ customerDisplayKey: params.displayId, isActive: true }).lean();
  if (!branch) return NextResponse.json({ error: "Display not found." }, { status: 404 });

  const [activeOrders, tables, categories, products] = await Promise.all([
    OrderModel.find({ branchId: branch._id, status: { $in: ["PLACED", "CONFIRMED", "PREPARING", "READY", "SERVED"] } }).select("orderNumber orderType tableId items createdAt updatedAt status").sort({ createdAt: 1 }).lean(),
    TableModel.find({ organizationId: branch.organizationId, branchId: branch._id }).select("label").lean(),
    CategoryModel.find({ organizationId: branch.organizationId, isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    ProductModel.find({ organizationId: branch.organizationId, isActive: true, isAvailable: { $ne: false } }).select("name description categoryId variants imagePublicId").sort({ name: 1 }).lean(),
  ]);
  const tableLabels = new Map(tables.map((table) => [String(table._id), table.label]));
  const categoryNames = new Map(categories.map((category) => [String(category._id), category.name]));
  const visibleOrders = activeOrders.filter(isVisibleOnDisplay);
  const ready = visibleOrders.filter(isReadyForDisplay);
  const waiting = visibleOrders.filter((order) => !isReadyForDisplay(order));
  const mapOrder = (order: typeof activeOrders[number]) => ({
    number: order.orderNumber,
    location: order.tableId ? tableLabels.get(String(order.tableId)) ?? "Table" : order.orderType.replaceAll("_", " "),
    createdAt: order.createdAt.toISOString(),
    items: order.items.slice(0, 3).map((item) => ({ name: item.nameSnapshot, quantity: item.quantity })),
  });

  return NextResponse.json({
    waitingOrders: waiting.map(mapOrder),
    readyOrders: ready.map(mapOrder),
    menu: products.map((product) => {
      const variant = product.variants.find((entry) => entry.isDefault) ?? product.variants[0];
      return {
        id: String(product._id), name: product.name, description: product.description ?? "Freshly prepared to order.",
        category: categoryNames.get(String(product.categoryId)) ?? "Menu", priceMinor: variant?.priceMinor ?? 0,
        imageUrl: cloudinaryImageUrl(product.imagePublicId),
      };
    }),
  }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
