export function MetricCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="border border-ink-line/20 rounded-lg p-4 bg-white">
      <p className="text-sm text-ink/60">{label}</p>
      <p className="font-display text-3xl mt-1 tabular-nums">{value}</p>
      {hint && <p className="text-xs text-ink/50 mt-1">{hint}</p>}
    </div>
  );
}
