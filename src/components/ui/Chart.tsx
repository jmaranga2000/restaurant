type ChartProps = {
  values: number[];
  label: string;
  color?: string;
  className?: string;
};

export function Chart({ values, label, color = "#4F46E5", className = "" }: ChartProps) {
  const safeValues = values.length > 1 ? values : [0, values[0] ?? 0];
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = max - min || 1;
  const points = safeValues.map((value, index) => {
    const x = (index / (safeValues.length - 1)) * 100;
    const y = 84 - ((value - min) / range) * 68;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className={`h-full w-full ${className}`} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
        <path d="M0 84H100" stroke="currentColor" strokeOpacity=".12" vectorEffect="non-scaling-stroke" />
        <path d="M0 50H100" stroke="currentColor" strokeOpacity=".08" vectorEffect="non-scaling-stroke" />
        <polygon points={`0,84 ${points} 100,84`} fill={color} opacity=".14" />
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  );
}
