/** Join trimmed parts with a single space; omit empty parts. */
export function formatPersonName(
  firstName?: string | null,
  lastName?: string | null,
): string {
  return [firstName, lastName]
    .map((part) => part?.trim() ?? "")
    .filter((part) => part.length > 0)
    .join(" ");
}

/**
 * Collapse whitespace. No space → the whole string is the first name.
 * Otherwise the last word is the last name ("Sara El Amrani" → "Sara El" / "Amrani").
 */
export function splitFullName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const collapsed = fullName.trim().replace(/\s+/g, " ");
  const lastSpace = collapsed.lastIndexOf(" ");
  if (lastSpace === -1) {
    return { firstName: collapsed, lastName: "" };
  }
  return {
    firstName: collapsed.slice(0, lastSpace),
    lastName: collapsed.slice(lastSpace + 1),
  };
}
