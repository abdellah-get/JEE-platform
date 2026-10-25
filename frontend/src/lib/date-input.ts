/** Convert ISO instant → value for `<input type="datetime-local">`. */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Convert datetime-local value → ISO instant for the API. */
export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}

export function formatEventWhen(startsAt: string, endsAt: string | null): string {
  const start = new Date(startsAt);
  const startLabel = start.toLocaleString("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  if (!endsAt) return startLabel;
  const end = new Date(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${startLabel} – ${end.toLocaleTimeString("fr-FR", { timeStyle: "short" })}`;
  }
  return `${startLabel} – ${end.toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}`;
}
