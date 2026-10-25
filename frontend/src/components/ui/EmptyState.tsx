export function EmptyState({
  title,
  description,
  action,
  compact = false,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  /** Variante plus courte pour sections imbriquées (dashboard, etc.). */
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? "rounded-xl border border-dashed border-line bg-brand-mist/80 px-4 py-6 text-center"
          : "surface px-6 py-10 text-center"
      }
    >
      <p className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-ink">
        {title}
      </p>
      {description && (
        <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
