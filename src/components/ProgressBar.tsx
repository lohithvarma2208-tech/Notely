export default function ProgressBar({
  done,
  total,
  showLabel = true,
  height = 8,
}: {
  done: number;
  total: number;
  showLabel?: boolean;
  height?: number;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
  return (
    <div>
      <div
        className="w-full overflow-hidden rounded-full bg-ink-100"
        style={{ height }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-500 to-accent-600 transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1.5 flex items-center justify-between text-xs text-ink-500">
          <span>
            {done} / {total} pages
          </span>
          <span className="font-semibold text-ink-700">{pct}%</span>
        </div>
      )}
    </div>
  );
}
