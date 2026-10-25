import { dueUrgency, formatDueDate } from "@/lib/tasks";
import type { TaskStatus } from "@/lib/types";

type Props = {
  dueDate: string | null | undefined;
  status?: TaskStatus;
  /** Affiche aussi la date formatée à côté du libellé. */
  showDate?: boolean;
};

export function DueBadge({ dueDate, status, showDate = false }: Props) {
  const urgency = dueUrgency(dueDate, status);
  if (!dueDate || urgency === "none") return null;

  const label = urgency === "overdue" ? "En retard" : "Bientôt";
  const className =
    urgency === "overdue"
      ? "bg-danger/10 text-danger"
      : "bg-warning-soft text-warning";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${className}`}
    >
      {label}
      {showDate ? ` · ${formatDueDate(dueDate)}` : null}
    </span>
  );
}
