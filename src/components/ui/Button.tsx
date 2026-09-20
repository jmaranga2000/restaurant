import Link from "next/link";
import clsx from "clsx";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  href?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  children,
  className,
  href,
  size = "md",
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  const classes = clsx(
    "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ember focus-visible:ring-offset-2 dark:focus-visible:ring-offset-ink disabled:pointer-events-none disabled:opacity-50",
    size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm",
    {
      "bg-indigo-600 text-white hover:bg-indigo-700": variant === "primary",
      "border border-ink-line/20 bg-white text-ink hover:bg-paper-dim dark:border-ink-line dark:bg-ink-soft dark:text-paper dark:hover:bg-ink-line": variant === "secondary",
      "text-ink/65 hover:bg-ink/5 hover:text-ink dark:text-paper/70 dark:hover:bg-paper/10 dark:hover:text-paper": variant === "ghost",
      "bg-status-cancelled text-white hover:bg-red-700": variant === "danger",
    },
    className
  );

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>;
  }

  return <button type={type} className={classes} {...props}>{children}</button>;
}
