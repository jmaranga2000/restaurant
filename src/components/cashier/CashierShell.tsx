"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

type CashierShellProps = {
  children: React.ReactNode;
  branchName: string;
};

const navigation = [
  { href: "/pos/register", label: "Register", icon: "▣", description: "New sale" },
  { href: "/pos", label: "POS", icon: "⊞", description: "Sales workspace" },
  { href: "/pos/orders", label: "Orders", icon: "◷", description: "Service queue" },
  { href: "/pos/loyalty", label: "Loyalty", icon: "◎", description: "Members & rewards" },
];

function isCurrentPath(pathname: string, href: string) {
  return href === "/pos" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

export function CashierShell({ children, branchName }: CashierShellProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  function closeMobileMenu() {
    setIsMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors dark:bg-ink dark:text-paper">
      {isMobileOpen ? <button type="button" aria-label="Close cashier navigation" onClick={closeMobileMenu} className="fixed inset-0 z-30 bg-ink/45 backdrop-blur-[1px] lg:hidden" /> : null}

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink-line/15 bg-white px-3 py-4 shadow-[8px_0_28px_rgba(8,44,70,0.05)] transition-transform duration-300 dark:border-ink-line dark:bg-ink-soft dark:shadow-none ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <Link href="/pos" onClick={closeMobileMenu} className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 font-display text-lg text-white shadow-sm" aria-hidden="true">⊞</span>
            <span className={isCollapsed ? "hidden" : "min-w-0"}>
              <b className="block truncate font-display text-base">Cashier</b>
              <small className="block truncate text-[10px] uppercase tracking-[.14em] text-ink/45 dark:text-paper/45">Point of sale</small>
            </span>
          </Link>
        </div>

        <div className="mt-6 rounded-xl border border-ink-line/15 bg-paper-dim p-3 dark:border-ink-line dark:bg-ink">
          <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-ink/45 dark:text-paper/45">Active branch</span>
          <p className="mt-1 truncate text-sm font-semibold">{branchName}</p>
        </div>

        <nav className="mt-6 space-y-1" aria-label="Cashier portal navigation">
          <p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-ink/40 dark:text-paper/40 ${isCollapsed ? "lg:hidden" : ""}`}>Workspace</p>
          {navigation.map((item) => {
            const current = isCurrentPath(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} onClick={closeMobileMenu} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${current ? "bg-indigo-600 text-white shadow-sm" : "text-ink/65 hover:bg-paper-dim hover:text-ink dark:text-paper/65 dark:hover:bg-paper/10 dark:hover:text-paper"}`}>
                <span className="grid h-5 w-5 shrink-0 place-items-center text-base" aria-hidden="true">{item.icon}</span>
                <span className="min-w-0"><b className="block text-sm">{item.label}</b><small className={`block text-[10px] ${current ? "text-white/70" : "text-ink/45 dark:text-paper/45"}`}>{item.description}</small></span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-ink-line/15 pt-3 dark:border-ink-line">
          <Link href="/choose-workspace" onClick={closeMobileMenu} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink/60 transition-colors hover:bg-paper-dim hover:text-ink dark:text-paper/65 dark:hover:bg-paper/10 dark:hover:text-paper"><span aria-hidden="true">←</span><span>Change workspace</span></Link>
          <ThemeToggle />
          <form action={logoutAction}><button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink/60 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-paper/65 dark:hover:bg-red-400/10 dark:hover:text-red-200"><span aria-hidden="true">↗</span><span>Sign out</span></button></form>
        </div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-300 ${isCollapsed ? "lg:pl-0" : "lg:pl-72"}`}>
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-ink-line/15 bg-paper/95 px-4 py-2 backdrop-blur dark:border-ink-line dark:bg-ink/95 sm:px-6">
          <button type="button" onClick={() => setIsMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-ink-line/20 text-ink/65 hover:bg-paper-dim dark:border-ink-line dark:text-paper/70 dark:hover:bg-paper/10 lg:hidden" aria-label="Open cashier navigation">☰</button>
          <button type="button" onClick={() => setIsCollapsed((collapsed) => !collapsed)} className="hidden rounded-lg border border-ink-line/15 bg-white px-3 py-2 text-xs text-ink/65 transition-colors hover:bg-paper-dim dark:border-ink-line dark:bg-ink-soft dark:text-paper/65 dark:hover:bg-ink-line lg:inline-flex">{isCollapsed ? "→ Show sidebar" : "← Hide sidebar"}</button>
          <div className="min-w-0"><b className="block truncate text-sm">{navigation.find((item) => isCurrentPath(pathname, item.href))?.label ?? "Cashier portal"}</b><small className="block truncate text-[10px] uppercase tracking-[.14em] text-ink/45 dark:text-paper/45">{branchName}</small></div>
          <div className="ml-auto lg:hidden"><ThemeToggle /></div>
        </header>
        {children}
      </div>
    </div>
  );
}
