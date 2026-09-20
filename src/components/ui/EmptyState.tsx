import type { ReactNode } from "react";
import { Card } from "./Card";

export function EmptyState({
  title,
  description,
  icon = "○",
  action,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Card className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-xl text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200" aria-hidden="true">{icon}</span>
      <h2 className="mt-4 font-display text-xl text-ink dark:text-paper">{title}</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink/60 dark:text-paper/65">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  );
}
