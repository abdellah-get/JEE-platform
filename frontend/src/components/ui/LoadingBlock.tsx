export function LoadingBlock({ label = "Chargement…" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm text-zinc-500" role="status">
      <span
        className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700"
        aria-hidden
      />
      {label}
    </div>
  );
}
