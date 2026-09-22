"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/inventory", label: "Stock list", icon: "▤" },
  { href: "/inventory/new", label: "New stock", icon: "+" },
  { href: "/inventory/ledger", label: "Stock ledger", icon: "↗" },
];

export function InventorySectionNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Inventory sections" className="mt-6 flex gap-2 overflow-x-auto pb-1">
      {sections.map((section) => {
        const active = pathname === section.href;
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${active
              ? "border-indigo-600 bg-indigo-600 text-white"
              : "border-ink-line/15 bg-white text-ink/65 hover:bg-paper-dim dark:border-ink-line dark:bg-ink-soft dark:text-paper/70 dark:hover:bg-ink-line"}`}
          >
            <span aria-hidden="true">{section.icon}</span>
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
