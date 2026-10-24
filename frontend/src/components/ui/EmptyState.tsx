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
          ? "rounded-lg border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-6 text-center"
          : "rounded-xl border border-dashed border-zinc-300 bg-white px-6 py-10 text-center"
      }
    >
      <p className="text-sm font-medium text-zinc-900">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-600">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
