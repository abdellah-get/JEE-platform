export function LoadingBlock({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex flex-col gap-3" role="status">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-soft border-t-brand"
          aria-hidden
        />
        {label}
      </div>
      <div className="skeleton-pulse h-2 max-w-xs rounded-full opacity-70" aria-hidden />
    </div>
  );
}
