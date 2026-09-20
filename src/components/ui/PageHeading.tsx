import type { ReactNode } from "react";

export function PageHeading({
  title,
  description,
  eyebrow,
  actions,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600 dark:text-indigo-300">{eyebrow}</p> : null}
        <h1 className="mt-1 font-display text-3xl tracking-tight text-ink dark:text-paper">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm text-ink/60 dark:text-paper/65">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
