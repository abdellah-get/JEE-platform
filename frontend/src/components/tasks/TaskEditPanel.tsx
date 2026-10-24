"use client";

import { FormEvent, useEffect, useId, useState } from "react";

import { Field } from "@/components/auth/Field";
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
  onClose: () => void;
  onSave: (payload: TaskEditPayload) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function TaskEditPanel({
  task,
  members,
  saving,
  error,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const titleId = useId();
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description ?? "");
    setPriority(task.priority);
    setDueDate(task.dueDate ?? "");
    setAssigneeId(task.assigneeId ?? "");
  }, [task]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmedDue = dueDate.trim();
    await onSave({
      title: title.trim(),
      description,
      priority,
      dueDate: trimmedDue,
      clearDueDate: !trimmedDue && !!task.dueDate,
      assigneeId,
      clearAssignee: !assigneeId && !!task.assigneeId,
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Fermer le panneau"
        className="absolute inset-0 bg-zinc-900/30"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-zinc-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-zinc-100 px-4 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Modifier la tâche
            </p>
            <h2 id={titleId} className="mt-0.5 text-lg font-semibold text-zinc-900">
              Édition
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-100"
          >
            Fermer
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            <Field
              id="edit-task-title"
              label="Titre"
              value={title}
              onChange={setTitle}
              required
            />

            <label className="block space-y-1.5" htmlFor="edit-task-description">
              <span className="text-sm font-medium text-zinc-700">Description</span>
              <textarea
                id="edit-task-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={4000}
                placeholder="Contexte, livrables, liens…"
                className="w-full resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-900 focus:ring-2"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="edit-task-priority"
                  className="mb-1 block text-sm font-medium text-zinc-700"
                >
                  Priorité
                </label>
                <select
                  id="edit-task-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                >
                  <option value="LOW">Basse</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="HIGH">Haute</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="edit-task-due"
                  className="mb-1 block text-sm font-medium text-zinc-700"
                >
                  Échéance
                </label>
                <input
                  id="edit-task-due"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="edit-task-assignee"
                className="mb-1 block text-sm font-medium text-zinc-700"
              >
                Assigné
              </label>
              <select
                id="edit-task-assignee"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
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
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 px-4 py-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void onDelete()}
              className="text-sm text-red-600 hover:underline disabled:opacity-50"
            >
              Supprimer
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving || !title.trim()}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
            </div>
          </div>
        </form>
      </aside>
    </div>
  );
}
