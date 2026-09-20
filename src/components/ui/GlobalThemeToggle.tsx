"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function GlobalThemeToggle() {
  const pathname = usePathname();

  // The landing page presents this control in its own navigation bar.
  if (pathname === "/") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] rounded bg-paper/90 p-1 shadow-lg backdrop-blur dark:bg-ink/90">
      <ThemeToggle />
    </div>
  );
}
