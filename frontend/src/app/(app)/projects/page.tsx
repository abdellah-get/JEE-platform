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
import { canCreateProject, roleLabel, statusLabel } from "@/lib/projects";
import { queryKeys } from "@/lib/query-keys";

export default function ProjectsPage() {
  const { accessToken, user, loading } = useAuth();
  const [query, setQuery] = useState("");
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
      projects.filter((p) =>
        matchesSearch(query, p.name, p.description, statusLabel(p.status)),
      ),
    [projects, query],
  );

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
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
            ? "Pilote l’ensemble des missions du club."
            : "Tes missions en cours et ton rôle dans chaque équipe."
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
        <LoadingBlock label="Chargement des projets…" />
      ) : projects.length === 0 ? (
        <EmptyState
          title="Aucun projet"
          description={
            showCreate
              ? "Crée le premier projet du club."
              : "Tu seras ajouté à une équipe par un chef de projet."
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
          <SearchInput
            id="projects-search"
            label="Rechercher un projet"
            value={query}
            onChange={setQuery}
            placeholder="Nom, description, statut…"
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun résultat"
              description="Aucun projet ne correspond à ta recherche."
              compact
              action={
                <button
                  type="button"
                  className="text-sm font-medium underline"
                  onClick={() => setQuery("")}
                >
                  Effacer la recherche
                </button>
              }
            />
          ) : (
            <ul className="stagger-list space-y-3">
              {filtered.map((project) => (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className="surface-interactive block p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-ink">
                          {project.name}
                        </p>
                        {project.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted">
                            {project.description}
                          </p>
                        )}
                      </div>
                      <span className="chip shrink-0">
                        {statusLabel(project.status)}
                      </span>
                    </div>
                    <div className="mt-4 space-y-2">
                      <ProgressBar value={project.progressPercent} />
                      <div className="flex items-center justify-between gap-3 text-xs text-muted">
                        <span>{roleLabel(project.myRole)}</span>
                        <span>{project.progressPercent}% complété</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <PaginationBar
            page={data?.page ?? page}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements ?? 0}
            onPageChange={(p) => {
              setPage(p);
              setQuery("");
            }}
          />
        </>
      )}
    </div>
  );
}
