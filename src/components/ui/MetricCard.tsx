import { Card } from "./Card";

export function MetricCard({
  label,
  value,
  hint,
  icon,
  trend,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: string;
  trend?: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink/55 dark:text-paper/60">{label}</p>
          <p className="mt-2 font-display text-3xl tabular-nums text-ink dark:text-paper">{value}</p>
        </div>
        {icon ? <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-lg text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-200" aria-hidden="true">{icon}</span> : null}
      </div>
      {trend ? <p className="mt-3 text-xs font-medium text-emerald-600 dark:text-emerald-300">{trend}</p> : null}
      {hint ? <p className="mt-2 text-xs leading-5 text-ink/50 dark:text-paper/50">{hint}</p> : null}
    </Card>
  );
}
