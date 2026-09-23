"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navigation = [
  { href: "/kitchen", label: "Kitchen display", icon: "▥" },
  { href: "/kitchen/orders", label: "Orders", icon: "▤" },
  { href: "/kitchen/stations", label: "Stations", icon: "⌁" },
  { href: "/kitchen/history", label: "Kitchen history", icon: "◷" },
  { href: "/kitchen/settings", label: "Kitchen settings", icon: "⚙" },
];

export function KitchenShell({ children, branchName, stations, canConfigure }: { children: React.ReactNode; branchName: string; stations: string[]; canConfigure: boolean }) {
  const pathname = usePathname();
  const visibleNavigation = navigation.filter((item) => item.href !== "/kitchen/settings" || canConfigure);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileOpen(false);
  }

  return (
    <div className="kitchen-surface min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      {isMobileOpen ? <button type="button" aria-label="Close kitchen navigation" onClick={closeMobileMenu} className="fixed inset-0 z-30 bg-ink/45 backdrop-blur-[1px] lg:hidden" /> : null}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink-line/15 bg-white px-3 py-4 shadow-[8px_0_28px_rgba(8,44,70,0.05)] transition-transform duration-300 dark:border-ink-line dark:bg-ink-soft dark:shadow-none ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}`}>
        <div className="flex items-center justify-between"><Link href="/kitchen" onClick={closeMobileMenu} className="flex min-w-0 items-center gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-400 text-lg text-ink shadow-sm">♨</span><span className="min-w-0"><b className="block truncate font-display text-base">Kitchen Display</b><small className="block truncate text-[10px] uppercase tracking-[.14em] text-ink/45 dark:text-paper/45">Preparation workspace</small></span></Link></div>
        <div className="mt-6 rounded-xl border border-ink-line/15 bg-paper-dim p-3 dark:border-ink-line dark:bg-ink"><span className="text-[10px] font-semibold uppercase tracking-[.14em] text-ink/45 dark:text-paper/45">Active branch</span><p className="mt-1 truncate text-sm font-semibold">{branchName}</p></div>
        <nav className="mt-6 space-y-1" aria-label="Kitchen portal navigation"><p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-ink/40 dark:text-paper/40">Workspace</p>{visibleNavigation.map((item) => { const active = item.href === "/kitchen" ? pathname === item.href : pathname.startsWith(`${item.href}/`) || pathname === item.href; return <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-indigo-600 text-white shadow-sm" : "text-ink/65 hover:bg-paper-dim hover:text-ink dark:text-paper/65 dark:hover:bg-paper/10 dark:hover:text-paper"}`}><span className="grid h-5 w-5 shrink-0 place-items-center text-base" aria-hidden="true">{item.icon}</span><span>{item.label}</span></Link>; })}</nav>
        <div className="mt-6 border-t border-ink-line/15 pt-4 dark:border-ink-line"><p className="px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-ink/40 dark:text-paper/35">Active stations</p><div className="mt-2 space-y-1">{stations.map((station) => <span key={station} className="flex items-center gap-2 px-3 py-1.5 text-xs text-ink/60 dark:text-paper/60"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{station}</span>)}</div></div>
        <div className="mt-auto space-y-2 border-t border-ink-line/15 pt-3 dark:border-ink-line"><Link href="/choose-workspace" onClick={closeMobileMenu} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink/60 transition-colors hover:bg-paper-dim hover:text-ink dark:text-paper/65 dark:hover:bg-paper/10 dark:hover:text-paper"><span aria-hidden="true">←</span><span>Change workspace</span></Link><ThemeToggle /><form action={logoutAction}><button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink/60 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-paper/65 dark:hover:bg-red-400/10 dark:hover:text-red-200"><span aria-hidden="true">↗</span><span>Sign out</span></button></form></div>
      </aside>
      <div className={`min-h-screen transition-[padding] duration-300 ${isCollapsed ? "lg:pl-0" : "lg:pl-72"}`}>
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-ink-line/15 bg-paper/95 px-4 py-2 backdrop-blur dark:border-ink-line dark:bg-ink/95 sm:px-6"><button type="button" onClick={() => setIsMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-ink-line/20 text-ink/65 hover:bg-paper-dim dark:border-ink-line dark:text-paper/70 dark:hover:bg-paper/10 lg:hidden" aria-label="Open kitchen navigation">☰</button><button type="button" onClick={() => setIsCollapsed((collapsed) => !collapsed)} className="hidden rounded-lg border border-ink-line/15 bg-white px-3 py-2 text-xs text-ink/65 transition-colors hover:bg-paper-dim dark:border-ink-line dark:bg-ink-soft dark:text-paper/65 dark:hover:bg-ink-line lg:inline-flex">{isCollapsed ? "→ Show sidebar" : "← Hide sidebar"}</button><div className="min-w-0"><b className="block truncate text-sm">{visibleNavigation.find((item) => item.href === "/kitchen" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`))?.label ?? "Kitchen portal"}</b><small className="block truncate text-[10px] uppercase tracking-[.14em] text-ink/45 dark:text-paper/45">{branchName}</small></div><div className="ml-auto hidden items-center gap-2 text-xs text-emerald-600 dark:text-emerald-300 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Kitchen online</div><div className="ml-auto lg:hidden"><ThemeToggle /></div></header>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
