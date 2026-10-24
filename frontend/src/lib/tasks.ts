import type { TaskPriority, TaskStatus } from "./types";

export const TASK_COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: "À faire" },
  { status: "IN_PROGRESS", label: "En cours" },
  { status: "DONE", label: "Fait" },
];

export function taskStatusLabel(status: TaskStatus): string {
  return TASK_COLUMNS.find((c) => c.status === status)?.label ?? status;
}

export function priorityLabel(priority: TaskPriority): string {
  switch (priority) {
    case "LOW":
      return "Basse";
    case "MEDIUM":
      return "Moyenne";
    case "HIGH":
      return "Haute";
  }
}

/** Affiche une échéance ISO `yyyy-MM-dd` en format local court. */
export function formatDueDate(dueDate: string): string {
  const d = parseLocalDate(dueDate);
  if (!d) return dueDate;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isDueOverdue(dueDate: string | null | undefined, status?: TaskStatus): boolean {
  if (!dueDate || status === "DONE") return false;
  const d = parseLocalDate(dueDate);
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d < today;
}

export function dueDateClassName(
  dueDate: string | null | undefined,
  status?: TaskStatus,
): string {
  if (!dueDate) return "text-zinc-500";
  if (isDueOverdue(dueDate, status)) return "font-medium text-red-600";
  return "text-zinc-600";
}

/**
 * Construit l'ordre d'ids pour une colonne après un drop.
 * @param beforeTaskId null = fin de colonne
 */
export function buildColumnOrder(
  columnTaskIds: string[],
  draggedId: string,
  beforeTaskId: string | null,
): string[] {
  const without = columnTaskIds.filter((id) => id !== draggedId);
  if (!beforeTaskId) {
    return [...without, draggedId];
  }
  const idx = without.indexOf(beforeTaskId);
  if (idx < 0) {
    return [...without, draggedId];
  }
  return [...without.slice(0, idx), draggedId, ...without.slice(idx)];
}

function parseLocalDate(isoDate: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}
