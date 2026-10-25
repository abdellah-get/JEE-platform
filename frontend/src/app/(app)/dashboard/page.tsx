"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { DueBadge } from "@/components/tasks/DueBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { statusLabel } from "@/lib/projects";
import { queryKeys } from "@/lib/query-keys";
import {
  dueDateClassName,
  formatDueDate,
  priorityLabel,
  taskStatusLabel,
} from "@/lib/tasks";

export default function DashboardPage() {
  const { user, loading, accessToken } = useAuth();
  const toast = useToast();
  const [exporting, setExporting] = useState(false);

  const {
    data,
    error,
    isPending,
    refetch,
  } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.getDashboard(accessToken!),
    enabled: Boolean(accessToken),
  });

  async function handleExport() {
    if (!accessToken || exporting) return;
    setExporting(true);
    try {
      await api.downloadDashboardExportCsv(accessToken);
      toast.success("Export CSV téléchargé.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Export impossible");
    } finally {
      setExporting(false);
    }
  }

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  if (error && !data) {
    return (
      <EmptyState
        title="Dashboard indisponible"
        description={
          error instanceof ApiError ? error.message : "Chargement impossible"
        }
        action={
          <button
            type="button"
            onClick={() => void refetch()}
            className="btn btn-primary"
          >
            Réessayer
          </button>
        }
      />
    );
  }

  if (isPending || !data) {
    return <LoadingBlock label="Chargement du dashboard…" />;
  }

  const kpis = data.kpis;
  const isBureau = user.clubRole === "BUREAU" || user.clubRole === "ADMIN_TECH";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Aujourd’hui"
        title={`Salut, ${user.firstName}`}
        description="Ce qui avance dans le club — projets, tâches et signaux urgents."
        actions={
          isBureau ? (
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="btn btn-secondary"
            >
              {exporting ? "Export…" : "Exporter CSV"}
            </button>
          ) : undefined
        }
      />

      {data.pinnedAnnouncements.length > 0 && (
        <section className="space-y-3">
          <h2 className="section-label">À traiter en priorité</h2>
          <ul className="stagger-list space-y-2">
            {data.pinnedAnnouncements.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/announcements/${a.id}`}
                  className="surface-interactive block border-warning/40 bg-warning-soft p-4"
                >
                  <p className="font-medium text-ink">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-ink/80">{a.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {kpis && (
        <section className="space-y-4">
          <div className="stagger-list grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Membres actifs", kpis.activeMembers],
              ["Projets", kpis.totalProjects],
              ["Projets actifs", kpis.activeProjects],
              ["Tâches ouvertes", kpis.openTasks],
              ["Pins urgents", kpis.pinnedAnnouncements],
            ].map(([label, value]) => (
              <div key={String(label)} className="kpi-tile">
                <p className="text-xs text-muted">{label}</p>
                <p className="mt-1 font-[family-name:var(--font-syne)] text-2xl font-bold tracking-tight text-brand">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="surface-quiet px-4 py-3 sm:col-span-2 lg:col-span-1">
              <p className="text-xs text-muted">Projets par statut</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Brouillon</dt>
                  <dd className="font-medium">{kpis.projectsBrouillon}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Actif</dt>
                  <dd className="font-medium">{kpis.projectsActif}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Terminé</dt>
                  <dd className="font-medium">{kpis.projectsTermine}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-muted">Archivé</dt>
                  <dd className="font-medium">{kpis.projectsArchive}</dd>
                </div>
              </dl>
            </div>
            <div className="surface-quiet px-4 py-3">
              <p className="text-xs text-muted">Avancement moyen</p>
              <p className="mt-1 page-title">
                {kpis.averageProgressPercent}%
              </p>
            </div>
            <div className="surface-quiet px-4 py-3">
              <p className="text-xs text-muted">Tâches en retard</p>
              <p
                className={`mt-1 page-title ${
                  kpis.overdueTasks > 0 ? "text-danger" : ""
                }`}
              >
                {kpis.overdueTasks}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="surface-quiet p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Mes projets</h2>
            <Link href="/projects" className="text-xs font-medium underline">
              Tout voir
            </Link>
          </div>
          {data.myProjects.length === 0 ? (
            <EmptyState
              compact
              title="Aucun projet"
              description="Tu apparaîtras ici dès qu’on t’ajoute à une équipe."
              action={
                <Link href="/projects" className="text-sm font-medium underline">
                  Voir les projets
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {data.myProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/projects/${p.id}`}
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-paper"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted">
                      {statusLabel(p.status)} · {p.progressPercent}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-quiet p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Mes tâches ouvertes</h2>
            <Link href="/tasks" className="text-xs font-medium underline">
              Tout voir
            </Link>
          </div>
          {data.myTasks.length === 0 ? (
            <EmptyState
              compact
              title="Aucune tâche ouverte"
              description="Les tâches qui te sont assignées s’affichent ici."
              action={
                <Link href="/tasks" className="text-sm font-medium underline">
                  Mes tâches
                </Link>
              }
            />
          ) : (
            <ul className="space-y-2">
              {data.myTasks.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/projects/${t.projectId}/tasks`}
                    className="block rounded-lg px-2 py-2 text-sm hover:bg-paper"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{t.title}</p>
                      <DueBadge dueDate={t.dueDate} status={t.status} />
                    </div>
                    <p className="text-xs text-muted">
                      {t.projectName} · {taskStatusLabel(t.status)} ·{" "}
                      {priorityLabel(t.priority)}
                      {t.dueDate ? (
                        <>
                          {" · "}
                          <span className={dueDateClassName(t.dueDate, t.status)}>
                            {formatDueDate(t.dueDate)}
                          </span>
                        </>
                      ) : null}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
