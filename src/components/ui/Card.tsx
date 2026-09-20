import clsx from "clsx";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={clsx(
        "rounded-xl border border-ink-line/15 bg-white shadow-[0_12px_32px_rgba(8,44,70,0.05)] dark:border-ink-line dark:bg-ink-soft dark:shadow-none",
        className
      )}
      {...props}
    />
  );
}
