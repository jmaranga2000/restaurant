"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navigation = [
  { href: "/kitchen", label: "Kitchen display", icon: "▥" },
  { href: "/kitchen/orders", label: "Orders", icon: "▤" },
  { href: "/kitchen/stations", label: "Stations", icon: "⌁" },
  { href: "/kitchen/history", label: "Kitchen history", icon: "◷" },
  { href: "/kitchen/settings", label: "Kitchen settings", icon: "⚙" },
];

export function KitchenShell({ children, branchName, stations }: { children: React.ReactNode; branchName: string; stations: string[] }) {
  const pathname = usePathname();
  return <div className="min-h-screen bg-[#04111f] text-[#eff8ff]">
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-white/10 bg-[#071827]/95 px-4 backdrop-blur sm:px-6">
      <Link href="/workspace" className="flex items-center gap-2 border-r border-white/10 pr-4"><span className="grid h-9 w-9 place-items-center rounded-lg bg-[#ffad28] text-lg text-[#07111d]">♨</span><span><b className="block text-sm">Kitchen OS</b><small className="block text-[9px] uppercase tracking-[.16em] text-white/45">Restaurant operations</small></span></Link>
      <div className="hidden rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-xs text-white/80 sm:block">{branchName}</div>
      <div className="flex items-center gap-2 text-xs text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Kitchen online</div>
      <div className="ml-auto"><ThemeToggle surface="sidebar" /></div>
    </header>
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="hidden w-56 shrink-0 border-r border-white/10 bg-[#061523] p-3 lg:flex lg:flex-col">
        <p className="px-3 py-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Kitchen</p>
        <nav className="space-y-1">{navigation.map((item) => { const active = item.href === "/kitchen" ? pathname === item.href : pathname.startsWith(item.href); return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-indigo-600 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"}`}><span className="w-4 text-center">{item.icon}</span>{item.label}</Link>; })}</nav>
        <div className="mt-6 border-t border-white/10 pt-4"><p className="px-3 text-[10px] font-semibold uppercase tracking-[.18em] text-white/35">Active stations</p><div className="mt-2 space-y-1">{stations.map((station) => <span key={station} className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/60"><i className="h-1.5 w-1.5 rounded-full bg-emerald-400" />{station}</span>)}</div></div>
        <div className="mt-auto rounded-lg border border-emerald-400/20 bg-emerald-400/5 p-3 text-xs text-emerald-200"><span className="mr-2 text-emerald-400">●</span>Kitchen display connected</div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  </div>;
}
