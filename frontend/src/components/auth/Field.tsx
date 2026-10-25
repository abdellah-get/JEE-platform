type FieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  /** Message d’erreur affiché sous le champ et lié via aria-describedby. */
  error?: string | null;
  /** id(s) additionnels pour aria-describedby (ex. erreur de formulaire). */
  describedBy?: string;
  /** Force aria-invalid (ex. erreur formulaire sans message sur ce champ). */
  invalid?: boolean;
};

export function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  error,
  describedBy,
  invalid,
}: FieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const describedByIds = [describedBy, errorId].filter(Boolean).join(" ") || undefined;
  const isInvalid = Boolean(invalid || error);

  return (
    <label className="block space-y-1.5" htmlFor={id}>
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedByIds}
        className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none ring-zinc-900 focus:ring-2 ${
          isInvalid ? "border-red-400" : "border-zinc-300"
        }`}
      />
      {error ? (
        <span id={errorId} role="alert" className="block text-sm text-red-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}
