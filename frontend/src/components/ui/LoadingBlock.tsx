export function LoadingBlock({
  label = "Chargement…",
  rows = 3,
}: {
  label?: string;
  /** Skeleton rows for denser pages (0 = spinner only). */
  rows?: number;
}) {
  return (
    <div className="loading-block" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="loading-block__spinner" aria-hidden />
        {label}
      </div>
      {rows > 0 ? (
        <div className="loading-block__skeleton" aria-hidden>
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className="skeleton-pulse loading-block__bar"
              style={{ width: `${88 - i * 12}%`, animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
