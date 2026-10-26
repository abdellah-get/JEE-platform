"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { DueBadge } from "@/components/tasks/DueBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import {
  dueDateClassName,
  dueUrgency,
  formatDueDate,
  priorityLabel,
  taskStatusLabel,
} from "@/lib/tasks";
import type { TaskPriority, TaskStatus } from "@/lib/types";

function statusTone(status: TaskStatus) {
  if (status === "DONE") return "termine";
  if (status === "IN_PROGRESS") return "actif";
  return "brouillon";
}

function priorityTone(priority: TaskPriority) {
  if (priority === "HIGH") return "haute";
  if (priority === "MEDIUM") return "moyenne";
  return "basse";
}

export default function MyTasksPage() {
  const { accessToken, loading } = useAuth();
  const [status, setStatus] = useState<TaskStatus | "">("");
  const [priority, setPriority] = useState<TaskPriority | "">("");
  const [projectId, setProjectId] = useState("");
  const [page, setPage] = useState(0);

  const filters = {
    status: status || undefined,
    priority: priority || undefined,
    projectId: projectId || undefined,
    page,
  };

  const { data: projectsPage } = useQuery({
    queryKey: queryKeys.projects(0),
    queryFn: () => api.listProjects(accessToken!, 0, 100),
    enabled: Boolean(accessToken),
  });
  const projects = projectsPage?.content ?? [];

  const {
    data: tasksPage,
    error,
    isPending,
  } = useQuery({
    queryKey: queryKeys.myTasks(filters),
    queryFn: () => api.listMyTasks(accessToken!, filters),
    enabled: Boolean(accessToken),
  });
  const tasks = tasksPage?.content ?? [];
  const total = tasksPage?.totalElements ?? tasks.length;
  const fullView = (tasksPage?.totalPages ?? 1) <= 1;
  const todoCount = tasks.filter((task) => task.status === "TODO").length;
  const doingCount = tasks.filter((task) => task.status === "IN_PROGRESS").length;
  const doneCount = tasks.filter((task) => task.status === "DONE").length;
  const lateCount = tasks.filter(
    (task) => dueUrgency(task.dueDate, task.status) === "overdue",
  ).length;
  const filtersActive = Boolean(status || priority || projectId);

  if (loading || !accessToken) {
    return <LoadingBlock label="Chargement de tes tâches…" rows={4} />;
  }

  const errorMessage =
    error instanceof ApiError ? error.message : error ? "Chargement impossible" : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Travail personnel"
        title="Mes tâches"
        description="Filtre par statut, priorité ou projet pour retrouver vite ce qui t’attend."
      />

      <div className="surface-quiet p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-status" className="text-xs font-medium text-muted">
              Statut
            </label>
            <select
              id="filter-status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as TaskStatus | "");
                setPage(0);
              }}
              aria-label="Filtrer par statut"
              className="select-field"
            >
              <option value="">Tous statuts</option>
              <option value="TODO">À faire</option>
              <option value="IN_PROGRESS">En cours</option>
              <option value="DONE">Fait</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-priority" className="text-xs font-medium text-muted">
              Priorité
            </label>
            <select
              id="filter-priority"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value as TaskPriority | "");
                setPage(0);
              }}
              aria-label="Filtrer par priorité"
              className="select-field"
            >
              <option value="">Toutes priorités</option>
              <option value="LOW">Basse</option>
              <option value="MEDIUM">Moyenne</option>
              <option value="HIGH">Haute</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="filter-project" className="text-xs font-medium text-muted">
              Projet
            </label>
            <select
              id="filter-project"
              value={projectId}
              onChange={(e) => {
                setProjectId(e.target.value);
                setPage(0);
              }}
              aria-label="Filtrer par projet"
              className="select-field"
            >
              <option value="">Tous projets</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {filtersActive ? (
          <button
            type="button"
            className="mt-3 text-xs font-semibold text-brand"
            onClick={() => {
              setStatus("");
              setPriority("");
              setProjectId("");
              setPage(0);
            }}
          >
            Réinitialiser
          </button>
        ) : null}
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
        <>
          <p className="text-sm text-muted">
            {total} tâche{total > 1 ? "s" : ""}
            {fullView ? (
              <>
                {" · "}
                {todoCount} à faire · {doingCount} en cours · {doneCount} faite
                {doneCount > 1 ? "s" : ""}
              </>
            ) : null}
            {fullView && lateCount > 0 ? ` · ${lateCount} en retard` : null}
          </p>
          <ul className="stagger-list space-y-3">
            {tasks.map((task) => (
              <li key={task.id}>
                <Link
                  href={`/projects/${task.projectId}/tasks`}
                  data-priority={task.priority}
                  className="task-card surface-interactive block p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-ink">
                        {task.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                        {task.description?.trim()
                          ? task.description
                          : "Pas encore de description."}
                      </p>
                    </div>
                    <DueBadge dueDate={task.dueDate} status={task.status} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="chip" data-tone={statusTone(task.status)}>
                      {taskStatusLabel(task.status)}
                    </span>
                    <span className="chip" data-tone={priorityTone(task.priority)}>
                      {priorityLabel(task.priority)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                    <span className="min-w-0 truncate">
                      {task.projectName}
                      {" · "}
                      {task.dueDate ? (
                        <span className={dueDateClassName(task.dueDate, task.status)}>
                          {formatDueDate(task.dueDate)}
                        </span>
                      ) : (
                        "Sans échéance"
                      )}
                    </span>
                    <span className="shrink-0 font-semibold text-brand">
                      Ouvrir le Kanban
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <PaginationBar
            page={tasksPage?.page ?? page}
            totalPages={tasksPage?.totalPages ?? 0}
            totalElements={tasksPage?.totalElements ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
