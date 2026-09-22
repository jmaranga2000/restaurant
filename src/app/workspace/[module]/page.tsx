import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeading } from "@/components/ui/PageHeading";
import { requireSession } from "@/lib/session";
import { connectToDatabase } from "@/lib/db";
import { canUseWorkspaceModule, workspaceModules, type WorkspaceModuleId } from "@/lib/workspace";
import { isOrgWideAccess, loadAuthContext } from "@/permissions/authorize";
import { OrganizationModel } from "@/models/Organization";
import { OrderModel } from "@/models/Order";
import { TableModel } from "@/models/Table";
import { CustomerModel } from "@/models/Customer";
import { CategoryModel, ProductModel } from "@/models/Product";
import { SupplierModel } from "@/models/Supplier";
import { BranchModel } from "@/models/Branch";
import { UserModel } from "@/models/User";
import { DisplayService } from "@/services/display.service";
import { rotateCustomerDisplayKeyAction } from "@/actions/branch.actions";
import type { AuthContext } from "@/permissions/authorize";
import { Types } from "mongoose";
import type { OrderStatus } from "@/types/order";

const statusTone: Partial<Record<OrderStatus, "warning" | "info" | "success" | "danger" | "neutral">> = { DRAFT: "neutral", PLACED: "warning", CONFIRMED: "info", PREPARING: "info", READY: "success", SERVED: "success", COLLECTED: "success", OUT_FOR_DELIVERY: "info", COMPLETED: "success", CANCELLED: "danger", REFUNDED: "danger", VOIDED: "danger" };

function simpleMoney(value: number, currency = "KES") {
  return new Intl.NumberFormat("en-KE", { style: "currency", currency, maximumFractionDigits: 0 }).format(value / 100);
}

const moduleLinks: Partial<Record<WorkspaceModuleId, { label: string; href: string }[]>> = {
  purchases: [{ label: "View stock ledger", href: "/inventory" }, { label: "Manage suppliers", href: "/workspace/suppliers" }],
  suppliers: [{ label: "View stock", href: "/inventory" }],
  transfers: [{ label: "View stock ledger", href: "/inventory" }],
  waste: [{ label: "Record stock movement", href: "/inventory" }],
  adjustments: [{ label: "Record stock movement", href: "/inventory" }],
  loyalty: [{ label: "View customers", href: "/workspace/customers" }],
  expenses: [{ label: "Open reports", href: "/reports" }],
  reconciliation: [{ label: "Open POS", href: "/pos" }],
  shifts: [{ label: "View branch employees", href: "/workspace/employees" }],
  signage: [{ label: "Open displays", href: "/workspace/displays" }],
  modifiers: [{ label: "Open POS", href: "/pos" }],
  combos: [{ label: "Open POS", href: "/pos" }],
  recipes: [{ label: "View stock", href: "/inventory" }],
};

export default async function WorkspaceModulePage({ params }: { params: { module: string } }) {
  const module = workspaceModules.find((item) => item.id === params.module);
  if (!module) notFound();
  if (module.liveHref) redirect(module.liveHref);

  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  if (!isOrgWideAccess(ctx) && !ctx.activeBranchId) redirect("/workspace");
  await connectToDatabase();
  const organization = await OrganizationModel.findById(ctx.organizationId).lean();
  if (!organization) redirect("/login");
  const available = canUseWorkspaceModule(module, ctx.permissions, organization.subscription?.plan, organization.subscription?.enabledModules);
  if (!available) {
    return <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Restaurant workspace" title={module.label} description={module.description} /><div className="mt-6"><EmptyState icon="✦" title="Available on your upgraded plan" description="This module is controlled by your restaurant’s subscription or your assigned permissions. Ask an owner to review access and plan settings." action={<Button href="/workspace/settings">Open restaurant settings</Button>} /></div></div>;
  }

  if (module.id === "orders") return <OrdersWorkspace organizationId={ctx.organizationId} activeBranchId={ctx.activeBranchId} />;
  if (module.id === "tables") return <TablesWorkspace organizationId={ctx.organizationId} activeBranchId={ctx.activeBranchId} />;
  if (module.id === "customers") return <CustomersWorkspace organizationId={ctx.organizationId} />;
  if (module.id === "menu" || module.id === "categories") return <MenuWorkspace organizationId={ctx.organizationId} mode={module.id} />;
  if (module.id === "suppliers") return <SuppliersWorkspace organizationId={ctx.organizationId} />;
  if (module.id === "displays") return <SecureDisplaysWorkspace ctx={ctx} />;
  if (module.id === "employees") return <EmployeesWorkspace organizationId={ctx.organizationId} activeBranchId={ctx.activeBranchId} />;

  return <ModuleFoundation module={module} />;
}

async function OrdersWorkspace({ organizationId, activeBranchId }: { organizationId: string; activeBranchId: string | null }) {
  const orders = await OrderModel.find({ organizationId, ...(activeBranchId ? { branchId: activeBranchId } : {}) }).sort({ createdAt: -1 }).limit(30).lean();
  const statuses: OrderStatus[] = ["PLACED", "PREPARING", "READY", "COMPLETED", "CANCELLED", "REFUNDED"];
  return <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Sales" title="Orders" description="Follow every order from creation through preparation, service, and completion." actions={<Button href="/pos">Create order</Button>} /><section className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-6">{statuses.map((status) => <Card key={status} className="p-4"><p className="text-xs text-ink/55 dark:text-paper/60">{status.replace("_", " ")}</p><p className="mt-2 font-display text-2xl text-ink dark:text-paper">{orders.filter((order) => order.status === status).length}</p></Card>)}</section><Card className="mt-4 overflow-hidden">{orders.length ? <div className="overflow-x-auto"><table className="w-full min-w-[780px] text-left text-sm"><thead className="border-b border-ink-line/15 bg-paper-dim text-xs uppercase tracking-wide text-ink/55 dark:border-ink-line dark:bg-ink dark:text-paper/55"><tr><th className="px-5 py-3 font-medium">Order</th><th className="px-3 py-3 font-medium">Service</th><th className="px-3 py-3 font-medium">Created</th><th className="px-3 py-3 font-medium">Status</th><th className="px-5 py-3 text-right font-medium">Total</th></tr></thead><tbody>{orders.map((order) => <tr key={String(order._id)} className="border-b border-ink-line/10 last:border-0 dark:border-ink-line"><td className="px-5 py-4"><b className="text-ink dark:text-paper">#{order.orderNumber}</b><small className="ml-2 text-xs text-ink/45 dark:text-paper/50">{order.items.length} item{order.items.length === 1 ? "" : "s"}</small></td><td className="px-3 py-4 text-ink/65 dark:text-paper/70">{order.orderType.replace("_", " ")}</td><td className="px-3 py-4 text-xs text-ink/55 dark:text-paper/60">{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</td><td className="px-3 py-4"><Badge tone={statusTone[order.status as OrderStatus] ?? "neutral"}>{order.status.replace("_", " ")}</Badge></td><td className="px-5 py-4 text-right font-medium text-ink dark:text-paper">{simpleMoney(order.totalMinor, order.currency)}</td></tr>)}</tbody></table></div> : <div className="p-5"><EmptyState icon="◷" title="No orders yet" description="New POS orders will appear here with their current status and complete service record." action={<Button href="/pos">Open POS</Button>} /></div>}</Card></div>;
}

async function TablesWorkspace({ organizationId, activeBranchId }: { organizationId: string; activeBranchId: string | null }) {
  const tables = await TableModel.find({ organizationId, ...(activeBranchId ? { branchId: activeBranchId } : {}) }).sort({ label: 1 }).lean();
  const style: Record<string, "success" | "danger" | "warning" | "neutral"> = { AVAILABLE: "success", OCCUPIED: "danger", RESERVED: "warning", NEEDS_CLEANING: "neutral" };
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Operations" title="Tables" description="See table availability at a glance and manage dine-in service from the floor." actions={<Button href="/admin/branches" variant="secondary">Manage branches</Button>} /><Card className="mt-6 p-5">{tables.length ? <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">{tables.map((table) => <div key={String(table._id)} className="rounded-xl border border-ink-line/15 p-4 dark:border-ink-line"><div className="flex items-center justify-between"><span className="font-display text-xl text-ink dark:text-paper">{table.label}</span><Badge tone={style[table.status] ?? "neutral"}>{table.status === "NEEDS_CLEANING" ? "Cleaning" : table.status.charAt(0) + table.status.slice(1).toLowerCase()}</Badge></div><p className="mt-5 text-sm text-ink/55 dark:text-paper/60">{table.seats} seats</p></div>)}</div> : <EmptyState icon="▦" title="No tables configured" description="Add tables during onboarding or create them from your restaurant settings." action={<Button href="/onboarding">Continue setup</Button>} />}</Card></div>;
}

async function CustomersWorkspace({ organizationId }: { organizationId: string }) {
  const customers = await CustomerModel.find({ organizationId, isActive: true }).sort({ createdAt: -1 }).limit(30).lean();
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Sales" title="Customers" description="Build customer relationships with visits, preferences, loyalty, and feedback." /><Card className="mt-6 overflow-hidden">{customers.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{customers.map((customer) => <div key={String(customer._id)} className="flex items-center gap-4 px-5 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{customer.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{customer.name}</b><small className="mt-1 block truncate text-xs text-ink/50 dark:text-paper/55">{customer.phone || customer.email || "No contact details"}</small></span><Badge tone="info">{customer.loyaltyPoints} pts</Badge></div>)}</div> : <div className="p-5"><EmptyState icon="◎" title="No customer profiles yet" description="Customer details will become available as you attach guests to POS orders." action={<Button href="/pos">Open POS</Button>} /></div>}</Card></div>;
}

async function MenuWorkspace({ organizationId, mode }: { organizationId: string; mode: "menu" | "categories" }) {
  const [categories, products] = await Promise.all([CategoryModel.find({ organizationId, isActive: true }).sort({ sortOrder: 1 }).lean(), ProductModel.find({ organizationId, isActive: true }).populate("categoryId", "name").sort({ name: 1 }).limit(40).lean()]);
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Menu" title={mode === "menu" ? "Menu items" : "Menu categories"} description={mode === "menu" ? "Manage what your team can sell, where it is prepared, and when it is available." : "Organize your restaurant menu into intuitive customer-facing categories."} actions={<Button href="/pos" variant="secondary">Open POS</Button>} /><Card className="mt-6 overflow-hidden">{mode === "categories" ? categories.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{categories.map((category) => <div key={String(category._id)} className="flex items-center gap-3 px-5 py-4"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">□</span><b className="flex-1 text-sm text-ink dark:text-paper">{category.name}</b><span className="text-xs text-ink/50 dark:text-paper/55">Position {category.sortOrder + 1}</span></div>)}</div> : <EmptyState icon="□" title="No categories yet" description="Complete setup to seed the starter categories, then tailor them to your menu." action={<Button href="/onboarding">Continue setup</Button>} /> : products.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{products.map((product) => <div key={String(product._id)} className="flex items-center gap-4 px-5 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">≡</span><span className="min-w-0 flex-1"><b className="block text-sm text-ink dark:text-paper">{product.name}</b><small className="mt-1 block truncate text-xs text-ink/50 dark:text-paper/55">{product.description || product.kitchenStation || "No description"}</small></span><span className="text-right text-xs text-ink/60 dark:text-paper/65">{product.variants[0] ? simpleMoney(product.variants[0].priceMinor) : "No price"}<small className="mt-1 block text-ink/45 dark:text-paper/50">{product.kitchenStation || "Unassigned"}</small></span></div>)}</div> : <EmptyState icon="≡" title="No menu items yet" description="Your product catalog starts here. Add categories, items, prices, recipes, and stations as your team is ready." action={<Button href="/pos">Open POS</Button>} />}</Card></div>;
}

async function SuppliersWorkspace({ organizationId }: { organizationId: string }) {
  const suppliers = await SupplierModel.find({ organizationId, isActive: true }).sort({ name: 1 }).lean();
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Inventory" title="Suppliers" description="Keep purchasing contacts, payment terms, and supply relationships in one place." /><Card className="mt-6 overflow-hidden">{suppliers.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{suppliers.map((supplier) => <div key={String(supplier._id)} className="flex items-center gap-4 px-5 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">⌂</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{supplier.name}</b><small className="mt-1 block truncate text-xs text-ink/50 dark:text-paper/55">{supplier.contactName || supplier.phone || supplier.email || "No contact details"}</small></span><Badge tone="neutral">{supplier.paymentTerms || "No terms"}</Badge></div>)}</div> : <div className="p-5"><EmptyState icon="⌂" title="No suppliers yet" description="Add suppliers as you begin creating purchase orders and receiving goods." action={<Button href="/inventory">Open inventory</Button>} /></div>}</Card></div>;
}

async function EmployeesWorkspace({ organizationId, activeBranchId }: { organizationId: string; activeBranchId: string | null }) {
  const users = await UserModel.find({ organizationId, isActive: true, ...(activeBranchId ? { assignedBranchIds: activeBranchId } : {}) }).populate("roleId", "name").sort({ name: 1 }).lean();
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="People" title="Branch employees" description="See the active team assigned to this operating location. Role and access changes remain controlled by Restaurant Administration." /><Card className="mt-6 overflow-hidden">{users.length ? <div className="divide-y divide-ink-line/10 dark:divide-ink-line">{users.map((user) => <div key={String(user._id)} className="flex items-center gap-4 px-5 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200">{user.name.slice(0, 2).toUpperCase()}</span><span className="min-w-0 flex-1"><b className="block truncate text-sm text-ink dark:text-paper">{user.name}</b><small className="mt-1 block truncate text-xs text-ink/50 dark:text-paper/55">{user.email}</small></span><Badge tone="neutral">{(user.roleId as unknown as { name?: string })?.name ?? "Assigned role"}</Badge></div>)}</div> : <div className="p-5"><EmptyState icon="◎" title="No employees assigned" description="A Restaurant Admin can assign a staff member to this branch from Users and roles." /></div>}</Card></div>;
}

async function DisplaysWorkspace({ ctx }: { ctx: AuthContext }) {
  const branches = await DisplayService.list(ctx);
  return <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow="Operations" title="Customer displays" description="Launch waiting and ready order screens on TVs, tablets, monitors, or any browser." /><Card className="mt-6 p-5">{branches.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{branches.map((branch) => <div key={String(branch._id)} className="rounded-xl border border-ink-line/15 p-4 dark:border-ink-line"><p className="font-display text-lg text-ink dark:text-paper">{branch.name}</p><p className="mt-1 text-xs text-ink/50 dark:text-paper/55">{branch.code}</p>{branch.customerDisplayKey ? <Button href={`/display/${branch.customerDisplayKey}`} size="sm" className="mt-5 w-full">Open fullscreen display ↗</Button> : null}</div>)}</div> : <EmptyState icon="▣" title="Add a branch first" description="A display belongs to a branch and updates its waiting and ready orders automatically." action={<Button href="/admin/branches">Manage branches</Button>} />}</Card></div>;
}

async function SecureDisplaysWorkspace({ ctx }: { ctx: AuthContext }) {
  const branches = await DisplayService.list(ctx);

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
      <PageHeading eyebrow="Operations" title="Customer displays" description="Each screen has a separate read-only access key. It can show menu, waiting orders, and ready orders, but never staff controls or payment data." />
      <Card className="mt-6 p-5">
        {branches.length ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{branches.map((branch) => {
          const displayKey = branch.customerDisplayKey;
          if (!displayKey) return null;
          return <div key={String(branch._id)} className="rounded-xl border border-ink-line/15 p-4 dark:border-ink-line"><p className="font-display text-lg text-ink dark:text-paper">{branch.name}</p><p className="mt-1 text-xs text-ink/50 dark:text-paper/55">{branch.code} · Guest display access</p><div className="mt-5 grid gap-2"><Link href={`/display/${displayKey}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">Launch customer display ↗</Link><form action={rotateCustomerDisplayKeyAction.bind(null, String(branch._id))}><Button type="submit" variant="secondary" size="sm" className="w-full">Rotate display access key</Button></form></div></div>;
        })}</div> : <EmptyState icon="▣" title="No assigned displays" description="A customer display belongs to a branch you manage." />}
      </Card>
    </div>
  );
}

function ModuleFoundation({ module }: { module: (typeof workspaceModules)[number] }) {
  const links = moduleLinks[module.id] ?? [];
  return <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8"><PageHeading eyebrow={module.group} title={module.label} description={module.description} /><Card className="mt-6 p-6 sm:p-8"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">Workspace foundation</p><h2 className="mt-2 font-display text-2xl text-ink dark:text-paper">Configure {module.label.toLowerCase()} at your pace</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-ink/60 dark:text-paper/65">This area is already controlled by your restaurant’s plan and permissions. Continue with the linked operational areas while you progressively complete your configuration.</p><div className="mt-6 flex flex-wrap gap-2">{links.map((link) => <Button key={link.href} href={link.href} variant="secondary">{link.label} <span aria-hidden="true">→</span></Button>)}<Button href="/onboarding" variant={links.length ? "ghost" : "primary"}>Continue restaurant setup</Button></div></Card></div>;
}
