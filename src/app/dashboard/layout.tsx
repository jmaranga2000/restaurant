import Link from "next/link";
import { requireSession } from "@/lib/session";
import { loadAuthContext, isOrgWideAccess } from "@/permissions/authorize";
import { PERMISSIONS } from "@/types/permissions";
import { BranchRepository } from "@/repositories/branch.repository";
import { logoutAction } from "@/actions/auth.actions";
import { BranchSwitcher } from "./BranchSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pos", label: "POS" },
  { href: "/kitchen", label: "Kitchen" },
  { href: "/inventory", label: "Inventory" },
  { href: "/reports", label: "Reports" },
];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const ctx = await loadAuthContext(session);

  const branches = isOrgWideAccess(ctx)
    ? (await BranchRepository.listByOrganization(ctx.organizationId)).map((b) => ({ id: String(b._id), name: b.name }))
    : (await BranchRepository.findManyByIds(ctx.organizationId, ctx.assignedBranchIds)).map((b) => ({
        id: String(b._id),
        name: b.name,
      }));

  const canManageOrg = ctx.permissions.includes(PERMISSIONS.SETTINGS_MANAGE);

  return (
    <div className="flex min-h-screen bg-paper text-ink transition-colors duration-300 dark:bg-ink dark:text-paper">
      <aside className="w-56 shrink-0 bg-ink text-paper flex flex-col">
        <div className="px-5 py-5">
          <span className="font-display text-lg">Restaurant OS</span>
          <p className="text-paper/40 text-xs uppercase tracking-wide mt-0.5">Shop</p>
        </div>

        {branches.length > 1 && (
          <div className="px-3 mb-2">
            <BranchSwitcher branches={branches} activeBranchId={ctx.activeBranchId} />
          </div>
        )}

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

        {canManageOrg && (
          <Link
            href="/admin"
            className="px-5 py-3 text-xs text-paper/50 hover:text-paper border-t border-ink-line"
          >
            Restaurant admin →
          </Link>
        )}

        <div className="px-2 pt-2"><ThemeToggle surface="sidebar" /></div>
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
