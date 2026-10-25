type PaginationBarProps = {
  page: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

export function PaginationBar({
  page,
  totalPages,
  totalElements,
  onPageChange,
  disabled,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <p>
        Page {page + 1} / {totalPages}
        <span className="ml-2 text-xs">({totalElements} au total)</span>
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled || page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          Précédent
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={disabled || page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
