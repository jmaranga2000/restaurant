/**
 * Every permission string the platform recognizes. Adding a new capability
 * means adding it here first — nothing should check an ad-hoc string.
 */
export const PERMISSIONS = {
  ORDERS_VIEW: "orders.view",
  ORDERS_CREATE: "orders.create",
  ORDERS_UPDATE: "orders.update",
  ORDERS_CANCEL: "orders.cancel",

  POS_ACCESS: "pos.access",
  POS_REFUND: "pos.refund",
  POS_DISCOUNT: "pos.discount",

  KITCHEN_ACCESS: "kitchen.access",
  DISPLAY_MANAGE: "display.manage",

  INVENTORY_VIEW: "inventory.view",
  INVENTORY_ADJUST: "inventory.adjust",
  INVENTORY_TRANSFER: "inventory.transfer",

  PURCHASES_VIEW: "purchases.view",
  PURCHASES_CREATE: "purchases.create",
  PURCHASES_APPROVE: "purchases.approve",

  REPORTS_VIEW: "reports.view",
  REPORTS_EXPORT: "reports.export",

  USERS_VIEW: "users.view",
  USERS_CREATE: "users.create",
  USERS_UPDATE: "users.update",
  USERS_DELETE: "users.delete",

  SETTINGS_MANAGE: "settings.manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS: Permission[] = Object.values(PERMISSIONS);

/**
 * Built-in role templates. Organizations can still define custom roles
 * (see Role model) — these are just the defaults created for a new org.
 */
export const DEFAULT_ROLE_TEMPLATES: Record<string, Permission[]> = {
  owner: ALL_PERMISSIONS,
  branch_manager: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.ORDERS_CANCEL,
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_REFUND,
    PERMISSIONS.POS_DISCOUNT,
    PERMISSIONS.KITCHEN_ACCESS,
    PERMISSIONS.DISPLAY_MANAGE,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_TRANSFER,
    PERMISSIONS.PURCHASES_VIEW,
    PERMISSIONS.PURCHASES_CREATE,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.USERS_VIEW,
  ],
  cashier: [
    PERMISSIONS.ORDERS_VIEW,
    PERMISSIONS.ORDERS_CREATE,
    PERMISSIONS.ORDERS_UPDATE,
    PERMISSIONS.POS_ACCESS,
  ],
  kitchen_staff: [PERMISSIONS.ORDERS_VIEW, PERMISSIONS.KITCHEN_ACCESS],
};
