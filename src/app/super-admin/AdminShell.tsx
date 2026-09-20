"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { platformLogoutAction } from "@/actions/platform.actions";

const navigation = [
  { label: "Overview", items: [{ href: "/super-admin/dashboard", label: "Dashboard" }] },
  { label: "Platform", items: [
    { href: "/super-admin/organizations", label: "Organizations" },
    { href: "/super-admin/branches", label: "Branches" },
    { href: "/super-admin/users", label: "Users" },
    { href: "/super-admin/users", label: "Roles & Permissions" },
  ] },
  { label: "Billing", items: [
    { href: "/super-admin/subscriptions", label: "Subscriptions" },
    { href: "/super-admin/subscriptions", label: "Plans" },
    { href: "/super-admin/subscriptions", label: "Payments" },
    { href: "/super-admin/subscriptions", label: "Revenue" },
  ] },
  { label: "Operations", items: [
    { href: "/super-admin/organizations", label: "Orders" },
    { href: "/super-admin/organizations", label: "Kitchens" },
    { href: "/super-admin/organizations", label: "Displays" },
    { href: "/super-admin/organizations", label: "Signage" },
  ] },
  { label: "System", items: [
    { href: "/super-admin/dashboard", label: "Analytics" },
    { href: "/super-admin/dashboard", label: "Jobs" },
    { href: "/super-admin/dashboard", label: "Integrations" },
    { href: "/super-admin/dashboard", label: "Audit Logs" },
    { href: "/super-admin/dashboard", label: "System Health" },
  ] },
  { label: "Settings", items: [{ href: "/super-admin/settings", label: "Organization Settings" }] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  if (pathname === "/super-admin/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-300 dark:bg-ink dark:text-paper">
      {sidebarOpen && <button aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-ink/30 lg:hidden" />}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-52 flex-col border-r border-ink-line/15 bg-ink text-paper transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${desktopSidebarCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}`}
      >
        <div className="flex h-14 items-center border-b border-ink-line px-4">
            <a href="/super-admin/dashboard" className="flex items-center gap-2 font-sans text-sm font-semibold tracking-tight"><span className="text-xl text-white">☁</span><span>RestroHub<small className="block text-[8px] font-normal text-paper/45">Super Admin Portal</small></span></a>
        </div>
          <div className="border-b border-ink-line px-4 py-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35">Platform control center</p>
          <p className="mt-1 text-xs text-paper/45">Global administration</p>
        </div>
          <nav className="flex-1 overflow-y-auto px-2 py-3">
          {navigation.map((group) => (
              <div key={group.label} className="mb-3">
              <p className="mb-1 px-2 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/30">{group.label}</p>
              <div className="space-y-0">
                {group.items.map((item, index) => (
                    <a key={`${item.label}-${index}`} href={item.href} onClick={() => setSidebarOpen(false)} className={`block px-2 py-1.5 text-xs transition-colors ${pathname === item.href || pathname.startsWith(item.href) && item.href !== "/super-admin/dashboard" ? "bg-paper/10 text-paper" : "text-paper/60 hover:bg-paper/10 hover:text-paper"}`}>
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-ink-line p-3">
          <button
            type="button"
            onClick={() => setDesktopSidebarCollapsed(true)}
            className="hidden w-full px-3 py-2 text-left text-xs text-paper/45 hover:bg-paper/10 hover:text-paper lg:block"
          >
            ← Collapse sidebar
          </button>
          <form action={platformLogoutAction}>
            <button className="w-full px-3 py-2 text-left text-xs text-paper/45 hover:bg-paper/10 hover:text-paper">Sign out</button>
          </form>
        </div>
      </aside>

      <div className={`transition-[padding] duration-300 ${desktopSidebarCollapsed ? "lg:pl-0" : "lg:pl-52"}`}>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-ink-line/15 bg-paper/95 px-4 backdrop-blur dark:bg-ink/95 sm:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setSidebarOpen(true)} className="text-sm text-ink/60 dark:text-paper/60 lg:hidden">Menu</button>
            <button
              type="button"
              onClick={() => setDesktopSidebarCollapsed((collapsed) => !collapsed)}
              aria-label={desktopSidebarCollapsed ? "Show sidebar" : "Collapse sidebar"}
              aria-pressed={desktopSidebarCollapsed}
              className="hidden items-center gap-2 border border-ink-line/15 bg-white px-3 py-2 text-xs text-ink/60 transition-colors hover:bg-paper dark:bg-ink-soft dark:text-paper/60 dark:hover:bg-ink-line lg:inline-flex"
            >
              <span aria-hidden="true">{desktopSidebarCollapsed ? "→" : "←"}</span>
              {desktopSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
            </button>
          </div>
          <div className="hidden h-9 w-72 items-center gap-3 border border-ink-line/15 bg-white px-3 text-xs text-ink/35 dark:bg-ink-soft dark:text-paper/35 sm:flex"><span>⌕</span><span className="flex-1">Search anything...</span><span className="font-mono text-[9px]">⌘ K</span></div>
          <div className="flex items-center gap-4">
            <span className="text-lg text-ink/50 dark:text-paper/50">♧</span><span className="text-xs text-ink/45 dark:text-paper/45">?</span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">JM</span><span className="hidden text-xs text-ink/60 dark:text-paper/60 sm:inline">James Maranga<small className="block text-[9px] text-indigo-500">Super Admin</small></span><span className="text-xs text-ink/40 dark:text-paper/40">⌄</span>
          </div>
        </header>
        <main className="super-admin-content">{children}</main>
      </div>
    </div>
  );
}
