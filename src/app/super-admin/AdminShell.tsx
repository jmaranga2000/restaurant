"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { platformLogoutAction } from "@/actions/platform.actions";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navigation = [
  { label: "Overview", items: [{ href: "/super-admin/dashboard", label: "Dashboard" }] },
  { label: "Platform", items: [{ href: "/super-admin/organizations", label: "Organizations" }, { href: "/super-admin/branches", label: "Branches" }, { href: "/super-admin/users", label: "Users" }, { href: "/super-admin/users", label: "Roles & permissions" }] },
  { label: "Billing", items: [{ href: "/super-admin/subscriptions", label: "Subscriptions" }, { href: "/super-admin/plans", label: "Plans" }, { href: "/super-admin/payments", label: "Payments" }, { href: "/super-admin/revenue", label: "Revenue" }] },
  { label: "Operations", items: [{ href: "/super-admin/organizations", label: "Orders" }, { href: "/super-admin/organizations", label: "Kitchens" }, { href: "/super-admin/organizations", label: "Displays" }, { href: "/super-admin/organizations", label: "Signage" }] },
  { label: "System", items: [{ href: "/super-admin/dashboard", label: "Analytics" }, { href: "/super-admin/dashboard", label: "Jobs" }, { href: "/super-admin/dashboard", label: "Integrations" }, { href: "/super-admin/dashboard", label: "Audit logs" }, { href: "/super-admin/dashboard", label: "System health" }] },
  { label: "Settings", items: [{ href: "/super-admin/settings", label: "Organization settings" }] },
];

type TopbarPanel = "notifications" | "help" | "account" | null;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [openPanel, setOpenPanel] = useState<TopbarPanel>(null);
  const pathname = usePathname();
  const router = useRouter();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  if (pathname === "/super-admin/login") return <>{children}</>;

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      searchRef.current?.focus();
      return;
    }
    setOpenPanel(null);
    router.push(`/super-admin/organizations?q=${encodeURIComponent(query)}`);
  }

  function togglePanel(panel: Exclude<TopbarPanel, null>) {
    setOpenPanel((current) => current === panel ? null : panel);
  }

  return (
    <div className="min-h-screen bg-paper text-ink transition-colors duration-300 dark:bg-ink dark:text-paper">
      {sidebarOpen ? <button aria-label="Close navigation" onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-20 bg-ink/30 lg:hidden" /> : null}

      <aside className={`fixed inset-y-0 left-0 z-30 flex w-52 flex-col border-r border-ink-line/15 bg-ink text-paper transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} ${desktopSidebarCollapsed ? "lg:-translate-x-full" : "lg:translate-x-0"}`}>
        <div className="flex h-14 items-center border-b border-ink-line px-4"><Link href="/super-admin/dashboard" className="flex items-center gap-2 font-sans text-sm font-semibold tracking-tight"><span className="text-xl text-white" aria-hidden="true">☁</span><span>RestroHub<small className="block text-[8px] font-normal text-paper/45">Super Admin Portal</small></span></Link></div>
        <div className="border-b border-ink-line px-4 py-3"><p className="font-mono text-[9px] uppercase tracking-[0.18em] text-paper/35">Platform control centre</p><p className="mt-1 text-xs text-paper/45">Global administration</p></div>
        <nav className="flex-1 overflow-y-auto px-2 py-3">{navigation.map((group) => <div key={group.label} className="mb-3"><p className="mb-1 px-2 font-mono text-[9px] uppercase tracking-[0.16em] text-paper/30">{group.label}</p><div>{group.items.map((item, index) => <Link key={`${item.label}-${index}`} href={item.href} onClick={() => setSidebarOpen(false)} className={`block px-2 py-1.5 text-xs transition-colors ${pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/super-admin/dashboard") ? "bg-paper/10 text-paper" : "text-paper/60 hover:bg-paper/10 hover:text-paper"}`}>{item.label}</Link>)}</div></div>)}</nav>
        <div className="border-t border-ink-line p-3"><div className="mb-1"><ThemeToggle surface="sidebar" /></div><button type="button" onClick={() => setDesktopSidebarCollapsed(true)} className="hidden w-full px-3 py-2 text-left text-xs text-paper/45 hover:bg-paper/10 hover:text-paper lg:block">← Collapse sidebar</button><form action={platformLogoutAction}><button className="w-full px-3 py-2 text-left text-xs text-paper/45 hover:bg-paper/10 hover:text-paper">Sign out</button></form></div>
      </aside>

      <div className={`transition-[padding] duration-300 ${desktopSidebarCollapsed ? "lg:pl-0" : "lg:pl-52"}`}>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-3 border-b border-ink-line/15 bg-paper/95 px-4 backdrop-blur dark:bg-ink/95 sm:px-6">
          <div className="flex shrink-0 items-center gap-2"><button onClick={() => setSidebarOpen(true)} className="text-sm text-ink/60 dark:text-paper/60 lg:hidden">Menu</button><button type="button" onClick={() => setDesktopSidebarCollapsed((collapsed) => !collapsed)} aria-label={desktopSidebarCollapsed ? "Show sidebar" : "Collapse sidebar"} aria-pressed={desktopSidebarCollapsed} className="hidden items-center gap-2 border border-ink-line/15 bg-white px-3 py-2 text-xs text-ink/60 transition-colors hover:bg-paper-dim dark:border-ink-line dark:bg-ink-soft dark:text-paper/60 dark:hover:bg-ink-line lg:inline-flex"><span aria-hidden="true">{desktopSidebarCollapsed ? "→" : "←"}</span>{desktopSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}</button></div>

          <form onSubmit={handleSearch} className="hidden h-9 min-w-0 max-w-md flex-1 items-center gap-2 rounded-lg border border-ink-line/15 bg-white px-3 text-xs text-ink/55 dark:border-ink-line dark:bg-ink-soft dark:text-paper/60 sm:flex"><span aria-hidden="true">⌕</span><input ref={searchRef} value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search organizations…" aria-label="Search organizations" className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-ink/35 dark:placeholder:text-paper/35" /><kbd className="hidden rounded border border-ink-line/15 px-1.5 py-0.5 font-mono text-[9px] text-ink/40 dark:border-ink-line dark:text-paper/40 md:inline">⌘ K</kbd><button type="submit" className="sr-only">Search</button></form>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <div className="relative"><button type="button" onClick={() => togglePanel("notifications")} aria-label="Notifications" aria-expanded={openPanel === "notifications"} className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink/55 transition-colors hover:bg-paper-dim hover:text-ink dark:text-paper/60 dark:hover:bg-ink-line dark:hover:text-paper"><span aria-hidden="true">♧</span><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-status-cancelled" /></button>{openPanel === "notifications" ? <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-ink-line/15 bg-white p-3 shadow-xl dark:border-ink-line dark:bg-ink-soft"><div className="flex items-center justify-between px-2 py-1"><b className="text-sm text-ink dark:text-paper">Notifications</b><span className="text-xs text-ink/45 dark:text-paper/50">2 to review</span></div><Link href="/super-admin/subscriptions" onClick={() => setOpenPanel(null)} className="mt-2 block rounded-lg p-3 hover:bg-paper-dim dark:hover:bg-ink-line"><p className="text-sm font-medium text-ink dark:text-paper">Payment follow-up</p><p className="mt-1 text-xs text-ink/55 dark:text-paper/60">7 organizations have overdue payments.</p></Link><Link href="/super-admin/branches" onClick={() => setOpenPanel(null)} className="mt-1 block rounded-lg p-3 hover:bg-paper-dim dark:hover:bg-ink-line"><p className="text-sm font-medium text-ink dark:text-paper">Branch availability</p><p className="mt-1 text-xs text-ink/55 dark:text-paper/60">3 branches have been offline for over 24 hours.</p></Link></div> : null}</div>

            <div className="relative"><button type="button" onClick={() => togglePanel("help")} aria-label="Help and shortcuts" aria-expanded={openPanel === "help"} className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/55 transition-colors hover:bg-paper-dim hover:text-ink dark:text-paper/60 dark:hover:bg-ink-line dark:hover:text-paper">?</button>{openPanel === "help" ? <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-ink-line/15 bg-white p-4 shadow-xl dark:border-ink-line dark:bg-ink-soft"><h2 className="font-display text-lg text-ink dark:text-paper">Quick help</h2><p className="mt-2 text-sm text-ink/60 dark:text-paper/65">Use <kbd className="rounded border border-ink-line/15 px-1 py-0.5 text-xs dark:border-ink-line">⌘ K</kbd> to search organizations.</p><div className="mt-4 grid gap-2"><Link href="/super-admin/organizations" onClick={() => setOpenPanel(null)} className="text-sm text-indigo-600 hover:underline dark:text-indigo-300">Manage organizations →</Link><Link href="/super-admin/settings" onClick={() => setOpenPanel(null)} className="text-sm text-indigo-600 hover:underline dark:text-indigo-300">Platform settings →</Link></div></div> : null}</div>

            <div className="relative"><button type="button" onClick={() => togglePanel("account")} aria-label="Open account menu" aria-expanded={openPanel === "account"} className="flex items-center gap-2 rounded-lg px-1 py-1 text-left transition-colors hover:bg-paper-dim dark:hover:bg-ink-line"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">JM</span><span className="hidden text-xs text-ink/60 dark:text-paper/65 md:inline">James Maranga<small className="block text-[9px] text-indigo-600 dark:text-indigo-300">Super Admin</small></span><span className="hidden text-xs text-ink/40 dark:text-paper/40 md:inline" aria-hidden="true">⌄</span></button>{openPanel === "account" ? <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-ink-line/15 bg-white p-2 shadow-xl dark:border-ink-line dark:bg-ink-soft"><div className="border-b border-ink-line/15 px-3 py-2 dark:border-ink-line"><p className="text-sm font-medium text-ink dark:text-paper">James Maranga</p><p className="mt-1 text-xs text-ink/50 dark:text-paper/55">Platform administrator</p></div><Link href="/super-admin/settings" onClick={() => setOpenPanel(null)} className="mt-1 block rounded-lg px-3 py-2 text-sm text-ink/70 hover:bg-paper-dim dark:text-paper/75 dark:hover:bg-ink-line">Platform settings</Link><form action={platformLogoutAction} className="mt-1 border-t border-ink-line/15 pt-1 dark:border-ink-line"><button className="w-full rounded-lg px-3 py-2 text-left text-sm text-status-cancelled hover:bg-red-50 dark:hover:bg-red-400/10">Sign out</button></form></div> : null}</div>
          </div>
        </header>
        <main className="super-admin-content">{children}</main>
      </div>
    </div>
  );
}
