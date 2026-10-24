"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { priorityLabel, taskStatusLabel } from "@/lib/tasks";
import type { Project, Task, TaskPriority, TaskStatus } from "@/lib/types";

export default function MyTasksPage() {
  const { accessToken, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [projectId, setProjectId] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api.listProjects(accessToken).then(setProjects).catch(() => setProjects([]));
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    api
      .listMyTasks(accessToken, {
        status: status || undefined,
        priority: priority || undefined,
        projectId: projectId || undefined,
      })
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Chargement impossible");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, status, priority, projectId]);

  if (loading || !accessToken) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mes tâches</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Tâches qui te sont assignées, tous projets confondus.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-xl border border-zinc-200 bg-white p-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus | "")}
          className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        >
          <option value="">Tous statuts</option>
          <option value="TODO">À faire</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="DONE">Fait</option>
        </select>
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority | "")}
          className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        >
          <option value="">Toutes priorités</option>
          <option value="LOW">Basse</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="HIGH">Haute</option>
        </select>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="min-w-[160px] flex-1 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm"
        >
          <option value="">Tous projets</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
          Aucune tâche assignée avec ces filtres.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {tasks.map((task) => (
            <li key={task.id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-zinc-900">{task.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {taskStatusLabel(task.status)} · {priorityLabel(task.priority)}
                    {task.dueDate ? ` · échéance ${task.dueDate}` : ""}
                  </p>
                </div>
                <Link
                  href={`/projects/${task.projectId}/tasks`}
                  className="text-xs font-medium text-zinc-700 underline"
                >
                  {task.projectName}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
