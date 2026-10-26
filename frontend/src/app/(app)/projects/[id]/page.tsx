"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ProjectAttachments } from "@/components/projects/ProjectAttachments";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canManageProject, roleLabel, statusLabel } from "@/lib/projects";
import type { Project, ProjectActivity, ProjectMember, ProjectStatus } from "@/lib/types";

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

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
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
    return <LoadingBlock label="Ouverture du projet…" rows={4} />;
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
    return <LoadingBlock label="Chargement du projet…" rows={4} />;
  }

  const manage = canManageProject(user.clubRole, project.myRole);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/projects" className="text-sm text-muted hover:text-ink">
        ← Projets
      </Link>

      <header className="project-hero reveal-up">
        <div className="flex flex-wrap items-center gap-2">
          <span className="chip" data-tone={tone(project.status)}>
            {statusLabel(project.status)}
          </span>
          <span className="text-xs text-muted">{roleLabel(project.myRole)}</span>
        </div>
        <h1 className="page-title mt-3">{project.name}</h1>
        <p className="page-subtitle">
          {project.description?.trim()
            ? project.description
            : "Ce projet n’a pas encore de description. Le Kanban et l’équipe restent accessibles."}
        </p>
        <div className="mt-5">
          <ProgressBar value={project.progressPercent} label="Avancement" />
        </div>
      </header>

      <nav aria-label="Espaces du projet" className="grid gap-3 sm:grid-cols-3">
        <Link href={`/projects/${project.id}/tasks`} className="dest-card">
          <strong>Kanban</strong>
          <span>Colonnes, priorités et échéances des tâches.</span>
        </Link>
        <Link href={`/projects/${project.id}/team`} className="dest-card">
          <strong>Équipe · {members.length}</strong>
          <span>Qui contribue, et avec quel rôle.</span>
        </Link>
        {manage ? (
          <Link href={`/projects/${project.id}/settings`} className="dest-card">
            <strong>Paramètres</strong>
            <span>Nom, statut et description du projet.</span>
          </Link>
        ) : null}
      </nav>

      <ProjectAttachments
        projectId={project.id}
        accessToken={accessToken}
        currentUserId={user.userId}
        canDeleteAny={manage}
      />

      <section className="panel" aria-label="Membres">
        <h2 className="section-heading">Équipe</h2>
        <p className="section-hint">Les personnes qui portent cette mission.</p>
        {members.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Aucun membre pour l’instant.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {members.map((m) => (
              <li key={m.userId} className="list-row flex items-center gap-3">
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand"
                  aria-hidden
                >
                  {initials(m.firstName, m.lastName)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {m.firstName} {m.lastName}
                  </span>
                  <span className="block truncate text-xs text-muted">{m.email}</span>
                </span>
                <span className="shrink-0 text-xs text-muted">{roleLabel(m.role)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel" aria-label="Fil d’activité">
        <h2 className="section-heading">Activité récente</h2>
        <p className="section-hint">Tâches déplacées, équipe, fichiers.</p>
        {activity.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              compact
              title="Aucune activité"
              description="Les mouvements de tâches et les changements d’équipe apparaîtront ici."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {activity.map((item) => (
              <li key={item.id} className="border-l-2 border-brand/50 pl-3 text-sm">
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
