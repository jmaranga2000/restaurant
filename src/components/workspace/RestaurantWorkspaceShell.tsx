"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { BranchSwitcher } from "@/app/dashboard/BranchSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import type { WorkspaceModule } from "@/lib/workspace";

type NavigationGroup = { group: string; items: WorkspaceModule[] };

export function RestaurantWorkspaceShell({
  children,
  branches,
  activeBranchId,
  allowAllBranches,
  navigation,
  organizationName,
  logoUrl,
  plan,
}: {
  children: React.ReactNode;
  branches: { id: string; name: string }[];
  activeBranchId: string | null;
  allowAllBranches: boolean;
  navigation: NavigationGroup[];
  organizationName: string;
  logoUrl?: string;
  plan: string;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      {mobileOpen ? <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-20 bg-ink/35 lg:hidden" /> : null}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-ink-line bg-ink text-paper transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} ${collapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}`}>
        <div className="border-b border-ink-line px-4 py-4"><Link href="/workspace" className="flex items-center gap-3" onClick={() => setMobileOpen(false)}>{logoUrl ? <Image src={logoUrl} width={40} height={40} alt="Restaurant logo" className="h-10 w-10 rounded-lg object-cover" unoptimized /> : <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-400/20 font-display text-lg text-indigo-100">R</span>}<span className="min-w-0"><span className="block truncate font-display text-lg">{organizationName}</span><span className="mt-0.5 block text-[10px] font-medium uppercase tracking-[0.14em] text-paper/45">Restaurant workspace</span></span></Link></div>
        <div className="border-b border-ink-line px-3 py-3"><p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/35">Viewing</p><BranchSwitcher branches={branches} activeBranchId={activeBranchId} allowAll={allowAllBranches} /></div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">{navigation.map(({ group, items }) => <div key={group} className="mb-4"><p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/35">{group}</p>{items.map((item) => { const href = item.liveHref ?? item.href; const active = href === "/workspace" ? pathname === "/workspace" : pathname === href || pathname.startsWith(`${href}/`); return <Link key={item.id} href={href} onClick={() => setMobileOpen(false)} className={`mb-0.5 flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm transition-colors ${active ? "bg-paper/12 text-paper" : "text-paper/65 hover:bg-paper/10 hover:text-paper"}`}><span className="w-4 text-center text-paper/55" aria-hidden="true">{item.icon}</span>{item.label}</Link>; })}</div>)}</nav>
        <div className="border-t border-ink-line p-3"><div className="mb-2 flex items-center justify-between rounded-lg bg-paper/8 px-3 py-2"><span className="text-xs text-paper/60">Plan</span><span className="text-xs font-medium text-indigo-200">{plan}</span></div><div className="mb-1"><ThemeToggle surface="sidebar" /></div><button type="button" onClick={() => setCollapsed(true)} className="hidden w-full rounded-lg px-3 py-2 text-left text-xs text-paper/50 transition-colors hover:bg-paper/10 hover:text-paper lg:block">← Collapse sidebar</button><form action={logoutAction}><button className="w-full rounded-lg px-3 py-2 text-left text-xs text-paper/60 transition-colors hover:bg-paper/10 hover:text-paper">Sign out</button></form></div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-300 ${collapsed ? "lg:pl-0" : "lg:pl-64"}`}>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-ink-line/15 bg-paper/95 px-4 backdrop-blur dark:bg-ink/95 sm:px-6"><button type="button" onClick={() => setMobileOpen(true)} className="text-sm text-ink/65 dark:text-paper/65 lg:hidden">Menu</button><button type="button" onClick={() => setCollapsed((value) => !value)} className="hidden rounded-lg border border-ink-line/15 bg-white px-3 py-2 text-xs text-ink/65 transition-colors hover:bg-paper-dim dark:border-ink-line dark:bg-ink-soft dark:text-paper/65 dark:hover:bg-ink-line lg:inline-flex">{collapsed ? "→ Show sidebar" : "← Hide sidebar"}</button><div className="ml-auto flex items-center gap-3"><Link href="/onboarding?edit=1" className="hidden text-xs text-ink/55 hover:text-indigo-600 dark:text-paper/60 dark:hover:text-indigo-300 sm:inline">Setup checklist</Link><Link href="/admin" className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white" aria-label="Restaurant administration">R</Link></div></header>
        <main>{children}</main>
      </div>
    </div>
  );
}
