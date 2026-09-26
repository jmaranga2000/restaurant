"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { PwaInstallButton } from "@/components/ui/PwaInstallButton";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const navigation = [
  { href: "#operations", label: "How it works" },
  { href: "#portals", label: "Workspaces" },
];

export function LandingNav() {
  const [isOpen, setIsOpen] = useState(false);

  function closeMenu() {
    setIsOpen(false);
  }

  return (
    <header className="border-b border-ink/10 bg-paper/90 backdrop-blur-md dark:border-ink-line dark:bg-ink/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-14 lg:py-5">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-display text-xl tracking-tight sm:text-2xl" onClick={closeMenu}>
          <Image src="/icons/logo5.png" width={48} height={48} alt="Restaurant OS" className="h-10 w-10 object-contain" priority unoptimized />
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-7 lg:flex">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm text-ink/60 transition-colors hover:text-ember dark:text-paper/65 dark:hover:text-ember-light">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <PwaInstallButton compact />
          <ThemeToggle />
          <Link href="/workspace" className="hidden px-2 py-2 text-sm font-medium text-ink transition-colors hover:text-ember dark:text-paper sm:inline-flex">
            Open workspace
          </Link>
          <Link href="/admin" className="hidden border border-ink/20 px-3 py-2 text-sm font-medium text-ink transition-colors hover:border-ink/45 hover:text-ember dark:border-paper/25 dark:text-paper dark:hover:border-paper/55 dark:hover:text-ember-light lg:inline-flex">
            Restaurant admin
          </Link>
          <Link href="/register" className="hidden bg-ink px-4 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-ink-soft dark:bg-paper dark:text-ink dark:hover:bg-paper-dim lg:inline-flex">
            Start free
          </Link>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="inline-flex h-9 w-9 items-center justify-center border border-ink/15 text-ink transition-colors hover:border-ink/35 hover:bg-paper-dim dark:border-paper/20 dark:text-paper dark:hover:border-paper/45 dark:hover:bg-paper/10 lg:hidden"
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          >
            <span className="sr-only">Menu</span>
            {isOpen ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path d="m6 6 12 12M18 6 6 18" /></svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            )}
          </button>
        </div>
      </div>

      <div id="mobile-navigation" className={`grid overflow-hidden transition-[grid-template-rows] duration-300 lg:hidden ${isOpen ? "grid-rows-[1fr] border-t border-ink/10 dark:border-ink-line" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0">
          <nav aria-label="Mobile navigation" className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4 sm:px-10">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href} onClick={closeMenu} className="border-b border-ink/10 py-3 text-base font-medium text-ink transition-colors hover:text-ember dark:border-ink-line dark:text-paper">
                {item.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Link href="/workspace" onClick={closeMenu} className="inline-flex items-center justify-center border border-ink/20 px-4 py-3 text-sm font-medium text-ink dark:border-paper/25 dark:text-paper">
                Open workspace
              </Link>
              <Link href="/admin" onClick={closeMenu} className="inline-flex items-center justify-center border border-ink/20 px-4 py-3 text-sm font-medium text-ink dark:border-paper/25 dark:text-paper">
                Restaurant admin
              </Link>
            </div>
            <Link href="/register" onClick={closeMenu} className="mt-2 inline-flex w-full items-center justify-center bg-ink px-4 py-3 text-sm font-medium text-paper dark:bg-paper dark:text-ink">
              Start free
            </Link>
            <div className="mt-2"><PwaInstallButton /></div>
          </nav>
        </div>
      </div>
    </header>
  );
}
