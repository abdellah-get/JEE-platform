export function LoadingBlock({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-muted" role="status">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-soft border-t-brand"
        aria-hidden
      />
      {label}
    </div>
  );
}
