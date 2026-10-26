type SectionBlockProps = {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Delay index for staggered section enter (0–5). */
  index?: number;
};

/** One purpose, one headline — keeps dense club pages scannable. */
export function SectionBlock({
  title,
  hint,
  action,
  children,
  className = "",
  index = 0,
}: SectionBlockProps) {
  return (
    <section
      className={`section-block reveal-up ${className}`}
      style={{ animationDelay: `${Math.min(index, 5) * 55}ms` }}
    >
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h2 className="section-heading">{title}</h2>
          {hint ? <p className="section-hint">{hint}</p> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}
