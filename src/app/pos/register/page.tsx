import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { ProductRepository } from "@/repositories/product.repository";
import { OrganizationModel } from "@/models/Organization";
import { CategoryModel } from "@/models/Product";
import { TableModel } from "@/models/Table";
import { CustomerModel } from "@/models/Customer";
import { OrderModel } from "@/models/Order";
import { connectToDatabase } from "@/lib/db";
import { PosClient } from "../PosClient";

export default async function RegisterPage() {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.POS_ACCESS);
  await connectToDatabase();

  const [products, organization, categories, tables, customers, openTickets] = await Promise.all([
    ProductRepository.listByCategory(ctx.organizationId),
    OrganizationModel.findById(ctx.organizationId).select("name defaultCurrency receipt settings").lean(),
    CategoryModel.find({ organizationId: ctx.organizationId, isActive: true }).select("name").lean(),
    ctx.activeBranchId ? TableModel.find({ organizationId: ctx.organizationId, branchId: ctx.activeBranchId }).sort({ label: 1 }).lean() : [],
    CustomerModel.find({ organizationId: ctx.organizationId, isActive: true }).sort({ name: 1 }).limit(100).lean(),
    ctx.activeBranchId ? OrderModel.find({
      organizationId: ctx.organizationId,
      branchId: ctx.activeBranchId,
      status: { $in: ["DRAFT", "PLACED", "CONFIRMED", "PREPARING", "READY"] },
      $expr: { $lt: [{ $sum: "$payments.amountMinor" }, "$totalMinor"] },
    }).sort({ updatedAt: -1 }).limit(30).lean() : [],
  ]);

  const categoryNames = new Map(categories.map((category) => [String(category._id), category.name]));
  const menu = products.map((product) => ({
    id: String(product._id), name: product.name, description: product.description ?? undefined,
    category: categoryNames.get(String(product.categoryId)) ?? "Menu", kitchenStation: product.kitchenStation ?? undefined,
    variants: product.variants.map((variant) => ({ id: String(variant._id), name: variant.name, priceMinor: variant.priceMinor, isDefault: variant.isDefault ?? false })),
    modifierGroups: product.modifierGroups.map((group) => ({ id: String(group._id), name: group.name, minSelect: group.minSelect, maxSelect: group.maxSelect, options: group.options.map((option) => ({ id: String(option._id), name: option.name, priceMinor: option.priceMinor })) })),
  }));
  const configuredPaymentMethods = organization?.settings?.paymentMethods?.flatMap((method) => method.enabled && method.code ? [{ code: method.code, label: method.label || method.code }] : []) ?? [];
  const paymentMethods = configuredPaymentMethods.length ? configuredPaymentMethods : [{ code: "CASH" as const, label: "Cash" }, { code: "MPESA" as const, label: "M-Pesa" }, { code: "CARD" as const, label: "Card" }, { code: "BANK" as const, label: "Bank transfer" }, { code: "OTHER" as const, label: "Other" }];

  return <PosClient menu={menu} branchId={ctx.activeBranchId} currency={organization?.defaultCurrency ?? "KES"} restaurantName={organization?.name ?? "Restaurant"} receipt={{ header: organization?.receipt?.header ?? undefined, footer: organization?.receipt?.footer ?? undefined, prefix: organization?.receipt?.prefix ?? undefined }} taxRatePercent={organization?.settings?.taxRatePercent ?? 0} serviceChargePercent={organization?.settings?.serviceChargePercent ?? 0} pricesIncludeTax={organization?.settings?.pricesIncludeTax ?? false} tables={tables.map((table) => ({ id: String(table._id), label: table.label, seats: table.seats, status: table.status }))} customers={customers.map((customer) => ({ id: String(customer._id), name: customer.name, phone: customer.phone ?? undefined, email: customer.email ?? undefined }))} paymentMethods={paymentMethods} canCollectPayments={ctx.permissions.includes(PERMISSIONS.PAYMENTS_COLLECT)} canDiscount={ctx.permissions.includes(PERMISSIONS.POS_DISCOUNT)} canRefund={ctx.permissions.includes(PERMISSIONS.POS_REFUND)} canVoid={ctx.permissions.includes(PERMISSIONS.ORDERS_CANCEL)} openTickets={openTickets.map((order) => ({ id: String(order._id), number: order.orderNumber, status: order.status, orderType: order.orderType, tableId: order.tableId ? String(order.tableId) : undefined, customerId: order.customerId ? String(order.customerId) : undefined, totalMinor: order.totalMinor, subtotalMinor: order.subtotalMinor, discountMinor: order.discountMinor, taxMinor: order.taxMinor, serviceChargeMinor: order.serviceChargeMinor, createdAt: order.createdAt.toISOString(), payments: order.payments.map((payment) => ({ method: payment.method, amountMinor: payment.amountMinor, reference: payment.reference ?? undefined, note: payment.note ?? undefined })), items: order.items.map((item) => ({ id: String(item._id), name: item.nameSnapshot, quantity: item.quantity, unitPriceMinor: item.unitPriceMinor })) }))} />;
}