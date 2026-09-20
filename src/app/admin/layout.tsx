import Link from "next/link";
import { requireSession } from "@/lib/session";
import { loadAuthContext, requirePermissions } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { logoutAction } from "@/actions/auth.actions";
import { Button } from "@/components/ui/Button";

const NAV = [
  { href: "/admin", label: "Overview", icon: "▥" },
  { href: "/admin/branches", label: "Branches", icon: "⌂" },
  { href: "/admin/users", label: "Users & roles", icon: "◎" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Guarding in the layout (not just each page) means every current and
  // future route under /admin is covered by one check.
  const session = await requireSession();
  const ctx = await loadAuthContext(session);
  requirePermissions(ctx, PERMISSIONS.SETTINGS_MANAGE);

  return (
    <div className="flex min-h-screen bg-paper text-ink transition-colors duration-300 dark:bg-ink dark:text-paper">
      <aside className="flex w-64 shrink-0 flex-col border-r border-ink-line bg-ink text-paper">
        <div className="border-b border-ink-line px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-400/20 text-lg text-indigo-100" aria-hidden="true">⌂</span>
            <span><span className="block font-display text-lg">Restaurant OS</span><span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-paper/45">Restaurant Admin</span></span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-5">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/35">Management</p>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-paper/70 transition-colors hover:bg-paper/10 hover:text-paper"
            >
              <span className="w-4 text-center text-paper/50" aria-hidden="true">{item.icon}</span>{item.label}
            </Link>
          ))}
        </nav>
        <Link href="/dashboard" className="mx-3 border-t border-ink-line px-3 py-4 text-xs text-paper/50 transition-colors hover:text-paper">
          ← Back to branch workspace
        </Link>
        <form action={logoutAction} className="px-3 pb-3">
          <Button type="submit" variant="ghost" className="w-full justify-start px-3 text-paper/60 hover:bg-paper/10 hover:text-paper">
            Sign out
          </Button>
        </form>
      </aside>
      <main className="flex-1 bg-paper dark:bg-ink">{children}</main>
    </div>
  );
}
