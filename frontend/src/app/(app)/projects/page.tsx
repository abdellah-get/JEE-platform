"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
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
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">Club</p>
          <h1 className="page-title mt-1">Projets</h1>
          <p className="page-subtitle">
            {showCreate
              ? "Tous les projets du club."
              : "Projets auxquels tu es affecté."}
          </p>
        </div>
        {showCreate && (
          <Link
            href="/projects/new"
            className="btn btn-primary"
          >
            Nouveau projet
          </Link>
        )}
      </div>

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
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block surface-quiet p-4 transition hover:border-line hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-ink">{project.name}</p>
                    {project.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-ink/80">
                    {statusLabel(project.status)}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                  <span>Ton rôle : {roleLabel(project.myRole)}</span>
                  <span>{project.progressPercent}% fait</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
