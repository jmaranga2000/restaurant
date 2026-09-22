"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <div className="kitchen-surface min-h-screen bg-paper text-ink dark:bg-ink dark:text-paper">
      <header className="sticky top-0 z-20 flex min-h-16 items-center gap-3 border-b border-ink-line/15 bg-paper/95 px-4 py-2 backdrop-blur dark:border-ink-line dark:bg-ink/95 sm:gap-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 border-r border-ink-line/15 pr-3 dark:border-ink-line sm:pr-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-400 text-lg text-ink">♨</span><span className="min-w-0"><b className="block truncate text-sm">Kitchen Display</b><small className="block truncate text-[9px] uppercase tracking-[.16em] text-ink/45 dark:text-paper/45">Preparation workspace</small></span></div>
        <div className="hidden rounded-lg border border-ink-line/15 bg-white px-3 py-2 text-xs text-ink/75 shadow-sm dark:border-ink-line dark:bg-ink-soft dark:text-paper/80 sm:block">{branchName}</div>
        <div className="hidden items-center gap-2 text-xs text-emerald-600 dark:text-emerald-300 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Kitchen online</div>
        <div className="ml-auto flex items-center gap-2"><ThemeToggle /><form action={logoutAction}><button type="submit" className="rounded-lg px-3 py-2 text-xs font-medium text-ink/60 transition-colors hover:bg-paper-dim hover:text-ink dark:text-paper/65 dark:hover:bg-paper/10 dark:hover:text-paper">Sign out</button></form></div>
      </header>
      <div className="min-h-[calc(100vh-4rem)] lg:pl-56">
        <aside className="hidden w-56 shrink-0 border-r border-ink-line/15 bg-white p-3 dark:border-ink-line dark:bg-ink-soft lg:fixed lg:inset-y-16 lg:left-0 lg:z-10 lg:flex lg:flex-col">
          <p className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-ink/40 dark:text-paper/35">Kitchen</p>
          <nav className="space-y-1">{visibleNavigation.map((item) => { const active = item.href === "/kitchen" ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-indigo-600 text-white" : "text-ink/65 hover:bg-paper-dim hover:text-ink dark:text-paper/65 dark:hover:bg-paper/10 dark:hover:text-paper"}`}><span className="w-4 text-center">{item.icon}</span>{item.label}</Link>; })}</nav>
          <div className="mt-6 border-t border-ink-line/15 pt-4 dark:border-ink-line"><p className="px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-ink/40 dark:text-paper/35">Active stations</p><div className="mt-2 space-y-1">{stations.map((station) => <span key={station} className="flex items-center gap-2 px-3 py-1.5 text-xs text-ink/60 dark:text-paper/60"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{station}</span>)}</div></div>
          <div className="mt-auto rounded-lg border border-emerald-400/25 bg-emerald-400/10 p-3 text-xs text-emerald-700 dark:text-emerald-200"><span className="mr-2 text-emerald-500 dark:text-emerald-400">●</span>Kitchen display connected</div>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
