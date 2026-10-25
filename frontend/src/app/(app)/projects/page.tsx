"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canCreateProject, roleLabel, statusLabel } from "@/lib/projects";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const { accessToken, user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setBusy(true);
    api
      .listProjects(accessToken)
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Chargement impossible");
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  const showCreate = canCreateProject(user.clubRole);

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

      {error && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {busy ? (
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
              <Link
                href="/projects/new"
                className="btn btn-primary"
              >
                Nouveau projet
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="stagger-list space-y-3">
          {projects.map((project) => (
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
                  <span className="chip shrink-0">{statusLabel(project.status)}</span>
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
    </div>
  );
}
