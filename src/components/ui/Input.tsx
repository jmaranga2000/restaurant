import { forwardRef } from "react";
import clsx from "clsx";
import type { InputHTMLAttributes } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-lg border border-ink-line/20 bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-ink-line dark:bg-ink-soft dark:text-paper dark:placeholder:text-paper/35",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
