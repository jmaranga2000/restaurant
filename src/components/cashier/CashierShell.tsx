"use client";

import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { logoutAction } from "@/actions/auth.actions";

export function CashierShell({ children, branchName }: { children: React.ReactNode; branchName: string }) {
  return (
    <div className="min-h-screen bg-paper text-ink transition-colors dark:bg-ink dark:text-paper">
      <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-ink-line/15 bg-paper/95 px-4 py-2 backdrop-blur dark:border-ink-line dark:bg-ink/95 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-indigo-600 font-display text-lg text-white" aria-hidden="true">⊞</span>
          <span className="min-w-0"><b className="block truncate text-sm">Cashier portal</b><small className="block truncate text-[10px] uppercase tracking-[.14em] text-ink/45 dark:text-paper/45">{branchName}</small></span>
        </div>
        <div className="ml-auto flex items-center gap-2"><ThemeToggle /><form action={logoutAction}><button type="submit" className="rounded-lg px-3 py-2 text-xs font-medium text-ink/60 transition-colors hover:bg-paper-dim hover:text-ink dark:text-paper/65 dark:hover:bg-paper/10 dark:hover:text-paper">Sign out</button></form></div>
      </header>
      {children}
    </div>
  );
}
