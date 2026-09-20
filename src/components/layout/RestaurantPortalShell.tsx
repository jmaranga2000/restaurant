"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { logoutAction } from "@/actions/auth.actions";
import { BranchSwitcher } from "@/app/dashboard/BranchSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export type RestaurantPortalNavigationItem = {
  href: string;
  label: string;
  icon?: string;
};

type BranchOption = { id: string; name: string };

export function RestaurantPortalShell({
  children,
  navigation,
  title,
  subtitle,
  homeHref,
  branches,
  activeBranchId,
  allowAllBranches,
  footerLink,
  headerLink,
}: {
  children: ReactNode;
  navigation: RestaurantPortalNavigationItem[];
  title: string;
  subtitle: string;
  homeHref: string;
  branches?: BranchOption[];
  activeBranchId?: string | null;
  allowAllBranches?: boolean;
  footerLink?: { href: string; label: string };
  headerLink?: { href: string; label: string };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => href === "/dashboard" || href === "/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-screen overflow-x-clip bg-paper text-ink transition-colors duration-300 dark:bg-ink dark:text-paper">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-30 bg-ink/50 backdrop-blur-[1px] lg:hidden"
        />
      ) : null}

      <aside
        aria-label="Restaurant navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,calc(100vw-3rem))] flex-col border-r border-ink-line bg-ink text-paper shadow-2xl transition-transform duration-300 lg:w-64 lg:translate-x-0 lg:shadow-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="min-w-0 border-b border-ink-line px-4 py-4 sm:px-5 sm:py-5">
          <Link href={homeHref} onClick={() => setMobileOpen(false)} className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-400/20 font-display text-lg text-indigo-100" aria-hidden="true">
              R
            </span>
            <span className="min-w-0">
              <span className="block truncate font-display text-lg text-paper">{title}</span>
              <span className="mt-0.5 block truncate text-[10px] font-medium uppercase tracking-[0.14em] text-paper/45">{subtitle}</span>
            </span>
          </Link>
        </div>

        {branches?.length ? (
          <div className="border-b border-ink-line px-3 py-3">
            <p className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/35">Active branch</p>
            <BranchSwitcher branches={branches} activeBranchId={activeBranchId ?? null} allowAll={allowAllBranches} />
          </div>
        ) : null}

        <nav className="flex-1 overscroll-contain overflow-y-auto px-3 py-4">
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper/35">Navigation</p>
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${isActive(item.href) ? "bg-paper/12 text-paper" : "text-paper/70 hover:bg-paper/10 hover:text-paper"}`}
            >
              {item.icon ? <span className="w-4 shrink-0 text-center text-paper/50" aria-hidden="true">{item.icon}</span> : null}
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="border-t border-ink-line p-3">
          {footerLink ? (
            <Link href={footerLink.href} onClick={() => setMobileOpen(false)} className="mb-1 block rounded-lg px-3 py-2 text-xs text-paper/60 transition-colors hover:bg-paper/10 hover:text-paper">
              {footerLink.label}
            </Link>
          ) : null}
          <ThemeToggle surface="sidebar" />
          <form action={logoutAction} className="mt-1">
            <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm text-paper/60 transition-colors hover:bg-paper/10 hover:text-paper">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="min-h-screen min-w-0 lg:pl-64">
        <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-ink-line/15 bg-paper/95 px-4 py-2 backdrop-blur dark:bg-ink/95 sm:px-6">
          <button
            type="button"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-ink-line/15 px-3 text-sm font-medium text-ink/70 transition-colors hover:bg-paper-dim dark:border-ink-line dark:text-paper/75 dark:hover:bg-ink-soft lg:hidden"
          >
            <span aria-hidden="true">☰</span>
            Menu
          </button>
          <span className="min-w-0 truncate text-sm font-medium text-ink/55 dark:text-paper/55 lg:text-ink/45 lg:dark:text-paper/45">{subtitle}</span>
          {headerLink ? (
            <Link href={headerLink.href} className="ml-auto shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-200 dark:hover:bg-indigo-400/10">
              {headerLink.label}
            </Link>
          ) : null}
        </header>
        <main className="min-w-0 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
