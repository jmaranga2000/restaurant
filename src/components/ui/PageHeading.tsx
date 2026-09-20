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
      {actions ? <div className="flex w-full shrink-0 flex-col gap-2 min-[420px]:flex-row sm:w-auto sm:flex-wrap [&>a]:w-full [&>button]:w-full min-[420px]:[&>a]:w-auto min-[420px]:[&>button]:w-auto">{actions}</div> : null}
    </header>
  );
}
