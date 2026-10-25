"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canManageProject, roleLabel, statusLabel } from "@/lib/projects";
import type { Project, ProjectActivity, ProjectMember } from "@/lib/types";

function formatActivityTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { accessToken, user, loading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [activity, setActivity] = useState<ProjectActivity[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !projectId) return;
    let cancelled = false;
    Promise.all([
      api.getProject(accessToken, projectId),
      api.listProjectMembers(accessToken, projectId),
      api.listProjectActivity(accessToken, projectId),
    ])
      .then(([p, m, a]) => {
        if (!cancelled) {
          setProject(p);
          setMembers(m);
          setActivity(a);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.status === 404
                ? "Projet introuvable ou accès refusé."
                : err.message
              : "Chargement impossible",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, projectId]);

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Link href="/projects" className="text-sm text-muted hover:text-ink">
          ← Projets
        </Link>
        <h1 className="page-title">Accès impossible</h1>
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      </div>
    );
  }

  if (!project) {
    return <LoadingBlock />;
  }

  const manage = canManageProject(user.clubRole, project.myRole);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/projects" className="text-sm text-muted hover:text-ink">
          ← Projets
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="page-title">{project.name}</h1>
            <p className="mt-1 text-sm text-muted">
              Rôle : {roleLabel(project.myRole)} · Avancement {project.progressPercent}%
            </p>
          </div>
          <span className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs font-medium text-ink/80">
            {statusLabel(project.status)}
          </span>
        </div>
      </div>

      {project.description && (
        <div className="surface-quiet p-5">
          <p className="text-sm text-muted">Description</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
            {project.description}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/projects/${project.id}/tasks`}
          className="btn btn-primary"
        >
          Kanban
        </Link>
        <Link
          href={`/projects/${project.id}/team`}
          className="btn btn-secondary"
        >
          Équipe ({members.length})
        </Link>
        {manage && (
          <Link
            href={`/projects/${project.id}/settings`}
            className="btn btn-secondary"
          >
            Paramètres
          </Link>
        )}
      </div>

      <div className="surface-quiet p-5">
        <h2 className="text-sm font-semibold text-ink">Membres</h2>
        {members.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Aucun membre pour l’instant.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between py-2 text-sm">
                <span>
                  {m.firstName} {m.lastName}
                  <span className="ml-2 text-muted">{m.email}</span>
                </span>
                <span className="text-xs text-muted">{roleLabel(m.role)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <section className="surface-quiet p-5" aria-label="Fil d’activité">
        <h2 className="text-sm font-semibold text-ink">Activité récente</h2>
        {activity.length === 0 ? (
          <EmptyState
            compact
            title="Aucune activité"
            description="Les créations / déplacements de tâches et changements d’équipe apparaîtront ici."
          />
        ) : (
          <ul className="mt-3 space-y-3">
            {activity.map((item) => (
              <li key={item.id} className="border-l-2 border-line pl-3 text-sm">
                <p className="text-ink">{item.message}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {formatActivityTime(item.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
