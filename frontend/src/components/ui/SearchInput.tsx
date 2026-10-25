"use client";

type SearchInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export function SearchInput({
  id,
  label,
  value,
  onChange,
  placeholder = "Rechercher…",
}: SearchInputProps) {
  const clearId = `${id}-clear`;

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="input-field pe-10"
      />
      {value ? (
        <button
          id={clearId}
          type="button"
          onClick={() => onChange("")}
          className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-paper hover:text-ink"
          aria-label="Effacer la recherche"
        >
          Effacer
        </button>
      ) : null}
    </div>
  );
}

/** Case-insensitive substring match across string fields. */
export function matchesSearch(query: string, ...fields: Array<string | null | undefined>) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return fields.some((f) => (f ?? "").toLowerCase().includes(q));
}
