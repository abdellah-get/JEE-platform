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
          ? "empty-state empty-state--compact"
          : "empty-state empty-state--full"
      }
      role="status"
    >
      <div className="empty-state__mark" aria-hidden />
      <p className="empty-state__title">{title}</p>
      {description ? (
        <p className="empty-state__desc">{description}</p>
      ) : null}
      {action ? <div className="empty-state__action">{action}</div> : null}
    </div>
  );
}
