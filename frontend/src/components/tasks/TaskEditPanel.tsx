"use client";

import { FormEvent, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Field } from "@/components/auth/Field";
import { TaskComments } from "@/components/tasks/TaskComments";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { formatDueDate, priorityLabel } from "@/lib/tasks";
import type { ProjectMember, Task, TaskPriority } from "@/lib/types";

export type TaskEditPayload = {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  clearDueDate: boolean;
  assigneeId: string;
  clearAssignee: boolean;
};

type Props = {
  task: Task;
  members: ProjectMember[];
  saving: boolean;
  error: string | null;
  canModerateComments?: boolean;
  canDelete?: boolean;
  onClose: () => void;
  onSave: (payload: TaskEditPayload) => Promise<void>;
  onDelete: () => Promise<void>;
};

function assigneeName(task: Task, members: ProjectMember[]) {
  const member = members.find((m) => m.userId === task.assigneeId);
  if (!member) return "Non assigné";
  return `${member.firstName} ${member.lastName}`;
}

function priorityTone(priority: TaskPriority) {
  switch (priority) {
    case "HIGH":
      return "haute";
    case "MEDIUM":
      return "moyenne";
    case "LOW":
      return "basse";
  }
}

export function TaskEditPanel({
  task,
  members,
  saving,
  error,
  canModerateComments = false,
  canDelete = false,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const readOnly = task.status === "DONE";
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [mounted, setMounted] = useState(false);

  useFocusTrap(panelRef, mounted);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mounted]);

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setDueDate(task.dueDate ?? "");
    setAssigneeId(task.assigneeId ?? "");
  }, [task]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !confirmDelete) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, confirmDelete]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    const trimmedDue = dueDate.trim();
    void onSave({
      title: title.trim(),
      description,
      priority,
      dueDate: trimmedDue,
      clearDueDate: !trimmedDue && !!task.dueDate,
      assigneeId,
      clearAssignee: !assigneeId && !!task.assigneeId,
    });
  }

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fermer le panneau"
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-line bg-surface shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand">
              {readOnly ? "Mission terminée" : "Modifier la tâche"}
            </p>
            <h2
              id={titleId}
              className="mt-1 font-[family-name:var(--font-syne)] text-xl font-semibold tracking-tight text-ink"
            >
              {task.title}
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {readOnly ? (
                <span className="chip" data-tone="termine">
                  Fait
                </span>
              ) : null}
              <span className="chip" data-tone={priorityTone(task.priority)}>
                {priorityLabel(task.priority)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary shrink-0 px-3 py-1.5 text-sm"
          >
            Fermer
          </button>
        </div>

        {readOnly ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <p className="text-sm text-muted">
                Cette mission est terminée. Tu peux relire le détail, pas le modifier.
              </p>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Description</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-ink">
                    {task.description?.trim() || "Aucune description."}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Échéance</dt>
                  <dd className="mt-1 text-ink">
                    {task.dueDate ? formatDueDate(task.dueDate) : "Sans échéance"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Assigné</dt>
                  <dd className="mt-1 text-ink">{assigneeName(task, members)}</dd>
                </div>
              </dl>
              <TaskComments taskId={task.id} readOnly />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <Field
                id="edit-task-title"
                label="Titre"
                value={title}
                onChange={setTitle}
                required
              />

              <label className="block space-y-1.5" htmlFor="edit-task-description">
                <span className="text-sm font-semibold text-ink">Description</span>
                <textarea
                  id="edit-task-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  maxLength={4000}
                  placeholder="Contexte, livrables, liens…"
                  className="input-field resize-y"
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="edit-task-priority"
                    className="mb-1.5 block text-sm font-semibold text-ink"
                  >
                    Priorité
                  </label>
                  <select
                    id="edit-task-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="select-field w-full"
                  >
                    <option value="LOW">Basse</option>
                    <option value="MEDIUM">Moyenne</option>
                    <option value="HIGH">Haute</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="edit-task-due"
                    className="mb-1.5 block text-sm font-semibold text-ink"
                  >
                    Échéance
                  </label>
                  <input
                    id="edit-task-due"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="edit-task-assignee"
                  className="mb-1.5 block text-sm font-semibold text-ink"
                >
                  Assigné
                </label>
                <select
                  id="edit-task-assignee"
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="select-field w-full"
                >
                  <option value="">Non assigné</option>
                  {members.map((m) => (
                    <option key={m.userId} value={m.userId}>
                      {m.firstName} {m.lastName}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
                  {error}
                </p>
              )}

              <TaskComments taskId={task.id} canModerate={canModerateComments} />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3">
              {canDelete ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setConfirmDelete(true)}
                  className="text-sm text-danger hover:underline disabled:opacity-50"
                >
                  Supprimer
                </button>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={saving}
                  className="btn btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim()}
                  className="btn btn-primary"
                >
                  {saving ? "Enregistrement…" : "Enregistrer"}
                </button>
              </div>
            </div>
          </form>
        )}
      </aside>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette tâche ?"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        danger
        busy={saving}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          void onDelete();
        }}
      />
    </div>,
    document.body,
  );
}
