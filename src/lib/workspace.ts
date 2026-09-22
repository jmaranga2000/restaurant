import { PERMISSIONS, type Permission } from "@/types/permissions";

export type SubscriptionPlan = "TRIAL" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";
export type WorkspaceModuleId =
  | "dashboard" | "pos" | "orders" | "customers" | "payments" | "kitchen" | "tables" | "displays" | "signage"
  | "menu" | "categories" | "modifiers" | "combos" | "recipes" | "stock" | "purchases" | "suppliers" | "transfers" | "waste" | "adjustments"
  | "employees" | "shifts" | "loyalty" | "expenses" | "reconciliation" | "reports" | "branches" | "settings";

export type WorkspaceModule = {
  id: WorkspaceModuleId;
  label: string;
  group: string;
  icon: string;
  description: string;
  href: string;
  permission?: Permission;
  minimumPlan?: Exclude<SubscriptionPlan, "TRIAL">;
  liveHref?: string;
};

export const workspaceModules: WorkspaceModule[] = [
  { id: "dashboard", label: "Dashboard", group: "Overview", icon: "▥", description: "A live operational view of your restaurant.", href: "/workspace" },
  { id: "pos", label: "POS", group: "Sales", icon: "⊞", description: "Take orders, apply charges, and send tickets to the kitchen.", href: "/workspace/pos", liveHref: "/pos", permission: PERMISSIONS.POS_ACCESS },
  { id: "orders", label: "Orders", group: "Sales", icon: "◷", description: "Track every order and its complete service timeline.", href: "/workspace/orders", permission: PERMISSIONS.ORDERS_VIEW },
  { id: "customers", label: "Customers", group: "Sales", icon: "◎", description: "Build customer profiles, visits, and loyalty relationships.", href: "/workspace/customers", permission: PERMISSIONS.ORDERS_VIEW },
  { id: "payments", label: "Payments", group: "Sales", icon: "¤", description: "Review cash, M-Pesa, card, refunds, and settlement activity.", href: "/workspace/payments", permission: PERMISSIONS.ORDERS_VIEW },
  { id: "kitchen", label: "Kitchen", group: "Operations", icon: "⌁", description: "Run station-aware preparation with timers, priorities, and kitchen notes.", href: "/workspace/kitchen", liveHref: "/kitchen", permission: PERMISSIONS.KITCHEN_ACCESS },
  { id: "tables", label: "Tables", group: "Operations", icon: "▦", description: "Manage floors, tables, capacity, reservations, and table transfers.", href: "/workspace/tables", permission: PERMISSIONS.ORDERS_UPDATE },
  { id: "displays", label: "Displays", group: "Operations", icon: "▣", description: "Launch customer-ready order displays on any screen.", href: "/workspace/displays", permission: PERMISSIONS.DISPLAY_MANAGE },
  { id: "signage", label: "Digital signage", group: "Operations", icon: "▤", description: "Create and schedule branded promotions for every display.", href: "/workspace/signage", permission: PERMISSIONS.DISPLAY_MANAGE, minimumPlan: "PROFESSIONAL" },
  { id: "menu", label: "Menu", group: "Menu", icon: "≡", description: "Manage sellable menu items, prices, availability, and station assignment.", href: "/workspace/menu", liveHref: "/admin/menu", permission: PERMISSIONS.SETTINGS_MANAGE },
  { id: "categories", label: "Categories", group: "Menu", icon: "□", description: "Organize menus into clear, service-ready categories.", href: "/workspace/categories", liveHref: "/admin/menu", permission: PERMISSIONS.SETTINGS_MANAGE },
  { id: "modifiers", label: "Modifiers", group: "Menu", icon: "±", description: "Set up item options and modifier groups.", href: "/workspace/modifiers", permission: PERMISSIONS.POS_ACCESS },
  { id: "combos", label: "Combos", group: "Menu", icon: "⊕", description: "Package popular items into promotions and meal combinations.", href: "/workspace/combos", permission: PERMISSIONS.POS_ACCESS, minimumPlan: "PROFESSIONAL" },
  { id: "recipes", label: "Recipes", group: "Menu", icon: "⌘", description: "Connect ingredients to dishes for food-cost and margin visibility.", href: "/workspace/recipes", permission: PERMISSIONS.INVENTORY_VIEW },
  { id: "stock", label: "Stock", group: "Inventory", icon: "▤", description: "Use the stock ledger to monitor balances and low-stock alerts.", href: "/workspace/stock", liveHref: "/inventory", permission: PERMISSIONS.INVENTORY_VIEW },
  { id: "purchases", label: "Purchases", group: "Inventory", icon: "↓", description: "Create purchase orders and receive goods from suppliers.", href: "/workspace/purchases", permission: PERMISSIONS.PURCHASES_VIEW },
  { id: "suppliers", label: "Suppliers", group: "Inventory", icon: "⌂", description: "Maintain supplier contacts, terms, and purchase history.", href: "/workspace/suppliers", permission: PERMISSIONS.PURCHASES_VIEW },
  { id: "transfers", label: "Transfers", group: "Inventory", icon: "↔", description: "Move stock between branches with an auditable record.", href: "/workspace/transfers", permission: PERMISSIONS.INVENTORY_TRANSFER, minimumPlan: "PROFESSIONAL" },
  { id: "waste", label: "Waste", group: "Inventory", icon: "×", description: "Record waste against the stock ledger and understand its cost.", href: "/workspace/waste", permission: PERMISSIONS.INVENTORY_ADJUST },
  { id: "adjustments", label: "Stock adjustments", group: "Inventory", icon: "±", description: "Make controlled stock corrections with a complete audit trail.", href: "/workspace/adjustments", permission: PERMISSIONS.INVENTORY_ADJUST },
  { id: "employees", label: "Employees", group: "People", icon: "◎", description: "See staff assigned to the active branch and their current roles.", href: "/workspace/employees", permission: PERMISSIONS.USERS_VIEW },
  { id: "shifts", label: "Shifts", group: "People", icon: "◴", description: "Track cashier shifts, attendance, cash opening, and closing variance.", href: "/workspace/shifts", permission: PERMISSIONS.USERS_VIEW, minimumPlan: "PROFESSIONAL" },
  { id: "loyalty", label: "Loyalty", group: "People", icon: "★", description: "Create loyalty points, rewards, offers, and customer tiers.", href: "/workspace/loyalty", permission: PERMISSIONS.ORDERS_VIEW, minimumPlan: "PROFESSIONAL" },
  { id: "expenses", label: "Expenses", group: "Finance", icon: "−", description: "Record approved operating expenses against categories and branches.", href: "/workspace/expenses", permission: PERMISSIONS.REPORTS_VIEW, minimumPlan: "PROFESSIONAL" },
  { id: "reconciliation", label: "Reconciliation", group: "Finance", icon: "✓", description: "Reconcile payment methods, refunds, and cashier close-outs.", href: "/workspace/reconciliation", permission: PERMISSIONS.POS_REFUND, minimumPlan: "PROFESSIONAL" },
  { id: "reports", label: "Reports", group: "Reports", icon: "↗", description: "Review sales, inventory, financial, staff, and branch reporting.", href: "/workspace/reports", liveHref: "/reports", permission: PERMISSIONS.REPORTS_VIEW },
  { id: "branches", label: "Branch management", group: "Branches", icon: "⌂", description: "Add branches and manage their local operating configuration.", href: "/workspace/branches", liveHref: "/admin/branches", permission: PERMISSIONS.SETTINGS_MANAGE },
  { id: "settings", label: "Restaurant settings", group: "Settings", icon: "⚙", description: "Manage restaurant details, taxes, receipts, payments, and integrations.", href: "/workspace/settings", liveHref: "/admin/settings", permission: PERMISSIONS.SETTINGS_MANAGE },
];

const planRank: Record<SubscriptionPlan, number> = { TRIAL: 0, STARTER: 1, PROFESSIONAL: 2, ENTERPRISE: 3 };

export function normalizeSubscriptionPlan(value: unknown): SubscriptionPlan {
  return value === "STARTER" || value === "PROFESSIONAL" || value === "ENTERPRISE" || value === "TRIAL" ? value : "TRIAL";
}

export function canUseWorkspaceModule(module: WorkspaceModule, permissions: readonly Permission[], planValue: unknown, overrides?: readonly string[]) {
  const plan = normalizeSubscriptionPlan(planValue);
  if (module.permission && !permissions.includes(module.permission)) return false;
  if (overrides?.includes(module.id)) return true;
  if (!module.minimumPlan) return true;
  return planRank[plan] >= planRank[module.minimumPlan];
}

export function groupedWorkspaceModules(permissions: readonly Permission[], planValue: unknown, overrides?: readonly string[]) {
  const visible = workspaceModules.filter((module) => canUseWorkspaceModule(module, permissions, planValue, overrides));
  return Array.from(new Set(visible.map((module) => module.group))).map((group) => ({ group, items: visible.filter((module) => module.group === group) }));
}
