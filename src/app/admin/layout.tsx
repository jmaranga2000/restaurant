import { RestaurantPortalShell } from "@/components/layout/RestaurantPortalShell";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";

const navigation = [
  { href: "/admin", label: "Overview", icon: "▥" },
  { href: "/admin/menu", label: "Menu studio", icon: "≡" },
  { href: "/admin/branches", label: "Branches", icon: "⌂" },
  { href: "/admin/displays", label: "Customer displays", icon: "▣" },
  { href: "/admin/users", label: "Users & roles", icon: "◎" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.RESTAURANT_ADMIN_ACCESS, PERMISSIONS.SETTINGS_MANAGE);

  return (
    <RestaurantPortalShell
      navigation={navigation}
      title="Restaurant OS"
      subtitle="Restaurant administration"
      homeHref="/admin"
      footerLink={{ href: "/dashboard", label: "← Back to branch workspace" }}
      headerLink={{ href: "/workspace", label: "Workspace" }}
    >
      {children}
    </RestaurantPortalShell>
  );
}
