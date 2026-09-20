import clsx from "clsx";
import type { ReactNode } from "react";

type BadgeTone = "neutral" | "info" | "success" | "warning" | "danger";

export function Badge({ children, className, tone = "neutral" }: { children: ReactNode; className?: string; tone?: BadgeTone }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        {
          "bg-ink/8 text-ink/65 dark:bg-paper/10 dark:text-paper/70": tone === "neutral",
          "bg-indigo-50 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-200": tone === "info",
          "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-200": tone === "success",
          "bg-amber-50 text-amber-700 dark:bg-amber-400/15 dark:text-amber-100": tone === "warning",
          "bg-red-50 text-red-700 dark:bg-red-400/15 dark:text-red-100": tone === "danger",
        },
        className
      )}
    >
      {children}
    </span>
  );
}
