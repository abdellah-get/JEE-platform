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
