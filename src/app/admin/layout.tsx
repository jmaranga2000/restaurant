import Link from "next/link";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { logoutAction } from "@/actions/auth.actions";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/branches", label: "Branches" },
  { href: "/admin/users", label: "Users & roles" },
  { href: "/admin/settings", label: "Settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Guarding in the layout (not just each page) means every current and
  // future route under /admin is covered by one check.
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);

  return (
    <div className="flex min-h-screen bg-paper text-ink transition-colors duration-300 dark:bg-ink dark:text-paper">
      <aside className="w-56 shrink-0 bg-ink text-paper flex flex-col">
        <div className="px-5 py-5">
          <span className="font-display text-lg">Restaurant OS</span>
          <p className="text-paper/40 text-xs uppercase tracking-wide mt-0.5">Restaurant Admin</p>
        </div>
        <nav className="flex-1 px-2 space-y-0.5">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2 rounded text-sm text-paper/80 hover:bg-ink-soft hover:text-paper transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="px-5 py-3 text-xs text-paper/50 hover:text-paper border-t border-ink-line">
          ← Back to branch (shop) view
        </Link>
        <form action={logoutAction} className="p-2">
          <button className="w-full text-left px-3 py-2 rounded text-sm text-paper/60 hover:bg-ink-soft hover:text-paper transition-colors">
            Sign out
          </button>
        </form>
      </aside>
      <main className="flex-1 bg-paper dark:bg-ink">{children}</main>
    </div>
  );
}
