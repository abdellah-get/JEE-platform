"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { DueBadge } from "@/components/tasks/DueBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  dueDateClassName,
  formatDueDate,
  priorityLabel,
  taskStatusLabel,
} from "@/lib/tasks";
import type { TaskPriority, TaskStatus } from "@/lib/types";

export default function MyTasksPage() {
  const { accessToken, loading } = useAuth();
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [projectId, setProjectId] = useState("");

  const filters = {
    status: status || undefined,
    priority: priority || undefined,
    projectId: projectId || undefined,
  };

  const { data: projects = [] } = useQuery({
    queryKey: queryKeys.projects,
    queryFn: () => api.listProjects(accessToken!),
    enabled: Boolean(accessToken),
  });

  const {
    data: tasks = [],
    error,
    isPending,
  } = useQuery({
    queryKey: queryKeys.myTasks(filters),
    queryFn: () => api.listMyTasks(accessToken!, filters),
    enabled: Boolean(accessToken),
  });

  if (loading || !accessToken) {
    return <LoadingBlock />;
  }

  const errorMessage =
    error instanceof ApiError ? error.message : error ? "Chargement impossible" : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="section-label">Travail personnel</p>
        <h1 className="page-title mt-1">Mes tâches</h1>
        <p className="page-subtitle">
          Tout ce qui t’est assigné, tous projets confondus.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 surface-quiet p-3">
        <label className="sr-only" htmlFor="filter-status">
          Filtrer par statut
        </label>
        <select
          id="filter-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as TaskStatus | "")}
          aria-label="Filtrer par statut"
          className="rounded-lg border border-line px-2 py-1.5 text-sm"
        >
          <option value="">Tous statuts</option>
          <option value="TODO">À faire</option>
          <option value="IN_PROGRESS">En cours</option>
          <option value="DONE">Fait</option>
        </select>
        <label className="sr-only" htmlFor="filter-priority">
          Filtrer par priorité
        </label>
        <select
          id="filter-priority"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TaskPriority | "")}
          aria-label="Filtrer par priorité"
          className="rounded-lg border border-line px-2 py-1.5 text-sm"
        >
          <option value="">Toutes priorités</option>
          <option value="LOW">Basse</option>
          <option value="MEDIUM">Moyenne</option>
          <option value="HIGH">Haute</option>
        </select>
        <label className="sr-only" htmlFor="filter-project">
          Filtrer par projet
        </label>
        <select
          id="filter-project"
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          aria-label="Filtrer par projet"
          className="min-w-[160px] flex-1 rounded-lg border border-line px-2 py-1.5 text-sm"
        >
          <option value="">Tous projets</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {isPending ? (
        <LoadingBlock label="Chargement des tâches…" />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="Aucune tâche"
          description="Aucune tâche assignée avec ces filtres."
          action={
            <Link href="/projects" className="btn btn-primary">
              Voir les projets
            </Link>
          }
        />
      ) : (
        <ul className="divide-y divide-line surface-quiet">
          {tasks.map((task) => (
            <li key={task.id} className="px-4 py-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-ink">{task.title}</p>
                    <DueBadge dueDate={task.dueDate} status={task.status} />
                  </div>
                  {task.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted">
                      {task.description}
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted">
                    {taskStatusLabel(task.status)} · {priorityLabel(task.priority)}
                    {task.dueDate ? (
                      <>
                        {" · échéance "}
                        <span className={dueDateClassName(task.dueDate, task.status)}>
                          {formatDueDate(task.dueDate)}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <Link
                  href={`/projects/${task.projectId}/tasks`}
                  className="text-xs font-medium text-ink/80 underline"
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
