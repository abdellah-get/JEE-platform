"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { SearchInput, matchesSearch } from "@/components/ui/SearchInput";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canCreateProject, PROJECT_STATUSES, roleLabel, statusLabel } from "@/lib/projects";
import { queryKeys } from "@/lib/query-keys";
import type { ProjectStatus } from "@/lib/types";

function tone(status: ProjectStatus) {
  switch (status) {
    case "ACTIF":
      return "actif";
    case "TERMINE":
      return "termine";
    case "ARCHIVE":
      return "archive";
    default:
      return "brouillon";
  }
}

export default function ProjectsPage() {
  const { accessToken, user, loading } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ProjectStatus | "">("");
  const [page, setPage] = useState(0);

  const {
    data,
    error,
    isPending,
  } = useQuery({
    queryKey: queryKeys.projects(page),
    queryFn: () => api.listProjects(accessToken!, page),
    enabled: Boolean(accessToken),
  });

  const projects = data?.content ?? [];

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        if (status && p.status !== status) return false;
        return matchesSearch(query, p.name, p.description, statusLabel(p.status));
      }),
    [projects, query, status],
  );

  const average =
    filtered.length === 0
      ? 0
      : Math.round(
          filtered.reduce((sum, p) => sum + p.progressPercent, 0) / filtered.length,
        );

  if (loading || !user || !accessToken) {
    return <LoadingBlock label="Chargement des projets…" rows={4} />;
  }

  const showCreate = canCreateProject(user.clubRole);
  const errorMessage =
    error instanceof ApiError ? error.message : error ? "Chargement impossible" : null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Portefeuille"
        title="Projets"
        description={
          showCreate
            ? "Ouvre une mission pour l’équipe, les tâches, les fichiers et le suivi."
            : "Tes missions : rôle, avancement, et accès au Kanban."
        }
        actions={
          showCreate ? (
            <Link href="/projects/new" className="btn btn-primary">
              Nouveau projet
            </Link>
          ) : undefined
        }
      />

      {errorMessage && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {isPending ? (
        <LoadingBlock label="Chargement des projets…" rows={4} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="Aucun projet"
          description={
            showCreate
              ? "Crée le premier projet du club pour y ajouter une équipe et des tâches."
              : "Tu apparaîtras ici dès qu’un chef de projet t’ajoute à une équipe."
          }
          action={
            showCreate ? (
              <Link href="/projects/new" className="btn btn-primary">
                Nouveau projet
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <div className="space-y-3">
            <SearchInput
              id="projects-search"
              label="Rechercher un projet"
              value={query}
              onChange={setQuery}
              placeholder="Nom, description, statut…"
            />
            <div
              role="group"
              aria-label="Filtrer par statut"
              className="flex flex-wrap gap-2"
            >
              <button
                type="button"
                className="chip chip-filter"
                aria-pressed={status === ""}
                onClick={() => setStatus("")}
              >
                Tous
              </button>
              {PROJECT_STATUSES.map((value) => (
                <button
                  key={value}
                  type="button"
                  className="chip chip-filter"
                  aria-pressed={status === value}
                  onClick={() => setStatus(value)}
                >
                  {statusLabel(value)}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun résultat"
              description="Aucun projet ne correspond à ce filtre. Élargis la recherche ou reviens à Tous."
              compact
              action={
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setQuery("");
                    setStatus("");
                  }}
                >
                  Réinitialiser
                </button>
              }
            />
          ) : (
            <>
              <p className="text-sm text-muted">
                {filtered.length} projet{filtered.length > 1 ? "s" : ""} · avancement
                moyen {average}%
              </p>
              <ul className="stagger-list space-y-3">
                {filtered.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/projects/${project.id}`}
                      data-tone={tone(project.status)}
                      className="project-card surface-interactive block p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-ink">
                            {project.name}
                          </p>
                          {project.description ? (
                            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted">
                              {project.description}
                            </p>
                          ) : (
                            <p className="mt-1 text-sm text-muted">
                              Pas encore de description.
                            </p>
                          )}
                        </div>
                        <span className="chip shrink-0" data-tone={tone(project.status)}>
                          {statusLabel(project.status)}
                        </span>
                      </div>
                      <div className="mt-4">
                        <ProgressBar
                          value={project.progressPercent}
                          label="Avancement"
                        />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                        <span>{roleLabel(project.myRole)}</span>
                        <span className="font-semibold text-brand">Ouvrir</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
          <PaginationBar
            page={data?.page ?? page}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements ?? 0}
            onPageChange={(p) => {
              setPage(p);
              setQuery("");
              setStatus("");
            }}
          />
        </>
      )}
    </div>
  );
}
