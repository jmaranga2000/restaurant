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
  { href: "/pos", label: "Register", icon: "▣", description: "New sale" },
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

      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink-line/15 bg-white px-3 py-4 shadow-[8px_0_28px_rgba(8,44,70,0.05)] transition-[transform,width] duration-200 dark:border-ink-line dark:bg-ink-soft dark:shadow-none ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} ${isCollapsed ? "lg:w-[5.5rem]" : "lg:w-72"} lg:translate-x-0`}>
        <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
          <Link href="/pos" onClick={closeMobileMenu} className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-600 font-display text-lg text-white shadow-sm" aria-hidden="true">⊞</span>
            <span className={isCollapsed ? "hidden" : "min-w-0"}>
              <b className="block truncate font-display text-base">Cashier</b>
              <small className="block truncate text-[10px] uppercase tracking-[.14em] text-ink/45 dark:text-paper/45">Point of sale</small>
            </span>
          </Link>
          <button type="button" onClick={() => setIsCollapsed((collapsed) => !collapsed)} className="hidden h-8 w-8 place-items-center rounded-lg text-ink/55 hover:bg-paper-dim hover:text-ink dark:text-paper/55 dark:hover:bg-paper/10 dark:hover:text-paper lg:grid" aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>{isCollapsed ? "›" : "‹"}</button>
        </div>

        <div className={`mt-6 rounded-xl border border-ink-line/15 bg-paper-dim p-3 dark:border-ink-line dark:bg-ink ${isCollapsed ? "lg:px-2" : ""}`} title={isCollapsed ? branchName : undefined}>
          <span className="text-[10px] font-semibold uppercase tracking-[.14em] text-ink/45 dark:text-paper/45">{isCollapsed ? "⌖" : "Active branch"}</span>
          <p className={`mt-1 truncate text-sm font-semibold ${isCollapsed ? "lg:hidden" : ""}`}>{branchName}</p>
        </div>

        <nav className="mt-6 space-y-1" aria-label="Cashier portal navigation">
          <p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-ink/40 dark:text-paper/40 ${isCollapsed ? "lg:hidden" : ""}`}>Workspace</p>
          {navigation.map((item) => {
            const current = isCurrentPath(pathname, item.href);
            return (
              <Link key={item.href} href={item.href} onClick={closeMobileMenu} title={isCollapsed ? item.label : undefined} className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${current ? "bg-indigo-600 text-white shadow-sm" : "text-ink/65 hover:bg-paper-dim hover:text-ink dark:text-paper/65 dark:hover:bg-paper/10 dark:hover:text-paper"} ${isCollapsed ? "lg:justify-center lg:px-2" : ""}`}>
                <span className="grid h-5 w-5 shrink-0 place-items-center text-base" aria-hidden="true">{item.icon}</span>
                <span className={`min-w-0 ${isCollapsed ? "lg:hidden" : ""}`}><b className="block text-sm">{item.label}</b><small className={`block text-[10px] ${current ? "text-white/70" : "text-ink/45 dark:text-paper/45"}`}>{item.description}</small></span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t border-ink-line/15 pt-3 dark:border-ink-line">
          <Link href="/choose-workspace" onClick={closeMobileMenu} title={isCollapsed ? "Change workspace" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink/60 transition-colors hover:bg-paper-dim hover:text-ink dark:text-paper/65 dark:hover:bg-paper/10 dark:hover:text-paper ${isCollapsed ? "lg:justify-center lg:px-2" : ""}`}><span aria-hidden="true">←</span><span className={isCollapsed ? "lg:hidden" : ""}>Change workspace</span></Link>
          <div className={isCollapsed ? "lg:hidden" : ""}><ThemeToggle /></div>
          <form action={logoutAction}><button type="submit" title={isCollapsed ? "Sign out" : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink/60 transition-colors hover:bg-red-50 hover:text-red-700 dark:text-paper/65 dark:hover:bg-red-400/10 dark:hover:text-red-200 ${isCollapsed ? "lg:justify-center lg:px-2" : ""}`}><span aria-hidden="true">↗</span><span className={isCollapsed ? "lg:hidden" : ""}>Sign out</span></button></form>
        </div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-200 ${isCollapsed ? "lg:pl-[5.5rem]" : "lg:pl-72"}`}>
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-ink-line/15 bg-paper/95 px-4 py-2 backdrop-blur dark:border-ink-line dark:bg-ink/95 sm:px-6">
          <button type="button" onClick={() => setIsMobileOpen(true)} className="grid h-9 w-9 place-items-center rounded-lg border border-ink-line/20 text-ink/65 hover:bg-paper-dim dark:border-ink-line dark:text-paper/70 dark:hover:bg-paper/10 lg:hidden" aria-label="Open cashier navigation">☰</button>
          <div className="min-w-0"><b className="block truncate text-sm">{navigation.find((item) => isCurrentPath(pathname, item.href))?.label ?? "Cashier portal"}</b><small className="block truncate text-[10px] uppercase tracking-[.14em] text-ink/45 dark:text-paper/45">{branchName}</small></div>
          <div className="ml-auto lg:hidden"><ThemeToggle /></div>
        </header>
        {children}
      </div>
    </div>
  );
}
