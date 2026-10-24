"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { Field } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { priorityLabel, TASK_COLUMNS } from "@/lib/tasks";
import type { Project, ProjectMember, Task, TaskPriority, TaskStatus } from "@/lib/types";

export default function ProjectTasksPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { accessToken, loading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [assigneeId, setAssigneeId] = useState("");
  const [creating, setCreating] = useState(false);

  async function reload(token: string) {
    const [p, t, m] = await Promise.all([
      api.getProject(token, projectId),
      api.listProjectTasks(token, projectId),
      api.listProjectMembers(token, projectId),
    ]);
    setProject(p);
    setTasks(t);
    setMembers(m);
  }

  useEffect(() => {
    if (!accessToken || !projectId) return;
    reload(accessToken).catch((err) =>
      setError(
        err instanceof ApiError
          ? err.status === 404
            ? "Projet introuvable ou accès refusé."
            : err.message
          : "Chargement impossible",
      ),
    );
  }, [accessToken, projectId]);

  const byStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      TODO: [],
      IN_PROGRESS: [],
      DONE: [],
    };
    for (const task of tasks) {
      map[task.status].push(task);
    }
    return map;
  }, [tasks]);

  if (loading || !accessToken) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  if (error && !project) {
    return (
      <div className="mx-auto max-w-5xl space-y-3">
        <Link href="/projects" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Projets
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (!project) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await api.createTask(accessToken!, projectId, {
        title: title.trim(),
        priority,
        assigneeId: assigneeId || undefined,
      });
      setTitle("");
      setAssigneeId("");
      await reload(accessToken!);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Création impossible");
    } finally {
      setCreating(false);
    }
  }

  async function moveTask(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    setError(null);
    try {
      const updated = await api.updateTask(accessToken!, task.id, { status });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
      const p = await api.getProject(accessToken!, projectId);
      setProject(p);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Déplacement impossible");
    }
  }

  async function onDelete(taskId: string) {
    setError(null);
    try {
      await api.deleteTask(accessToken!, taskId);
      await reload(accessToken!);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression impossible");
    }
  }

  async function onAssign(task: Task, nextAssignee: string) {
    setError(null);
    try {
      const updated = await api.updateTask(
        accessToken!,
        task.id,
        nextAssignee
          ? { assigneeId: nextAssignee }
          : { clearAssignee: true },
      );
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Assignation impossible");
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/projects/${project.id}`}
            className="text-sm text-zinc-500 hover:text-zinc-800"
          >
            ← {project.name}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Kanban</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Avancement : {project.progressPercent}%
          </p>
        </div>
      </div>

      <form
        onSubmit={onCreate}
        className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-white p-4"
      >
        <div className="min-w-[200px] flex-1">
          <Field id="task-title" label="Nouvelle tâche" value={title} onChange={setTitle} required />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Priorité</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="LOW">Basse</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="HIGH">Haute</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Assigné</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
          >
            <option value="">—</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.firstName} {m.lastName}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={creating || !title.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {creating ? "…" : "Ajouter"}
        </button>
      </form>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {TASK_COLUMNS.map((col) => (
          <section
            key={col.status}
            className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData("text/task-id");
              const task = tasks.find((t) => t.id === taskId);
              if (task) void moveTask(task, col.status);
            }}
          >
            <h2 className="mb-3 px-1 text-sm font-semibold text-zinc-800">
              {col.label}{" "}
              <span className="font-normal text-zinc-500">
                ({byStatus[col.status].length})
              </span>
            </h2>
            <ul className="space-y-2">
              {byStatus[col.status].map((task) => (
                <li
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/task-id", task.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="cursor-grab rounded-lg border border-zinc-200 bg-white p-3 shadow-sm active:cursor-grabbing"
                >
                  <p className="text-sm font-medium text-zinc-900">{task.title}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {priorityLabel(task.priority)}
                    {task.dueDate ? ` · ${task.dueDate}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <select
                      value={task.assigneeId ?? ""}
                      onChange={(e) => onAssign(task, e.target.value)}
                      className="max-w-full flex-1 rounded border border-zinc-200 px-1.5 py-1 text-xs"
                    >
                      <option value="">Non assigné</option>
                      {members.map((m) => (
                        <option key={m.userId} value={m.userId}>
                          {m.firstName} {m.lastName}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => onDelete(task.id)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Suppr.
                    </button>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {TASK_COLUMNS.filter((c) => c.status !== task.status).map((c) => (
                      <button
                        key={c.status}
                        type="button"
                        onClick={() => moveTask(task, c.status)}
                        className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-zinc-700 hover:bg-zinc-200"
                      >
                        → {c.label}
                      </button>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
