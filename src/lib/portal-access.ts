import type { Permission } from "@/types/permissions";
import { PERMISSIONS } from "@/types/permissions";

/** Only these system roles may operate across every branch without an explicit assignment. */
const ORGANIZATION_WIDE_ROLE_SLUGS = new Set(["owner", "restaurant_admin"]);

export function isOrganizationWideRole(roleSlug: string) {
  return ORGANIZATION_WIDE_ROLE_SLUGS.has(roleSlug);
}

/** Selects the first workspace a user is actually allowed to operate after sign-in. */
export function defaultPortalFor(permissions: readonly Permission[]) {
  if (permissions.includes(PERMISSIONS.RESTAURANT_ADMIN_ACCESS)) return "/admin";
  if (permissions.includes(PERMISSIONS.MANAGER_WORKSPACE_ACCESS)) return "/workspace";
  if (permissions.includes(PERMISSIONS.POS_ACCESS)) return "/pos";
  if (permissions.includes(PERMISSIONS.KITCHEN_ACCESS)) return "/kitchen";
  return "/login?error=No%20workspace%20has%20been%20assigned%20to%20this%20account.";
}

/** Prevents a sign-in redirect from becoming a shortcut into another portal. */
export function canOpenPortalPath(pathname: string, permissions: readonly Permission[]) {
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return permissions.includes(PERMISSIONS.RESTAURANT_ADMIN_ACCESS);
  }
  if (pathname === "/workspace" || pathname.startsWith("/workspace/") || pathname === "/dashboard" || pathname.startsWith("/dashboard/") || pathname === "/reports" || pathname.startsWith("/reports/") || pathname === "/inventory" || pathname.startsWith("/inventory/")) {
    return permissions.includes(PERMISSIONS.MANAGER_WORKSPACE_ACCESS);
  }
  if (pathname === "/pos" || pathname.startsWith("/pos/")) return permissions.includes(PERMISSIONS.POS_ACCESS);
  if (pathname === "/kitchen" || pathname.startsWith("/kitchen/")) return permissions.includes(PERMISSIONS.KITCHEN_ACCESS);
  return false;
}
