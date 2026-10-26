"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { DueBadge } from "@/components/tasks/DueBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionBlock } from "@/components/ui/SectionBlock";
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
    return <LoadingBlock label="Préparation de ton espace…" rows={4} />;
  }

  if (error && !data) {
    return (
      <EmptyState
        title="Vue d’ensemble indisponible"
        description={
          error instanceof ApiError
            ? error.message
            : "Impossible de charger le tableau de bord pour le moment."
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
    return <LoadingBlock label="Chargement du dashboard…" rows={5} />;
  }

  const kpis = data.kpis;
  const isBureau = user.clubRole === "BUREAU" || user.clubRole === "ADMIN_TECH";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        eyebrow="Aujourd’hui"
        title={`Salut, ${user.firstName}`}
        description="Repère vite ce qui bloque, ce qui avance, et ce que le bureau a épinglé."
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

      {data.pinnedAnnouncements.length > 0 ? (
        <SectionBlock
          index={0}
          title="À traiter en priorité"
          hint="Annonces épinglées par le bureau — lis-les avant le reste."
        >
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
        </SectionBlock>
      ) : null}

      {kpis ? (
        <SectionBlock
          index={1}
          title="Signaux du club"
          hint="Chiffres clés pour voir l’activité d’un coup d’œil."
        >
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

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="panel sm:col-span-2 lg:col-span-1">
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
            <div className="panel">
              <p className="text-xs text-muted">Avancement moyen</p>
              <p className="mt-1 page-title">{kpis.averageProgressPercent}%</p>
            </div>
            <div className="panel">
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
        </SectionBlock>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionBlock
          index={2}
          title="Mes projets"
          hint="Tes missions en cours."
          action={
            <Link
              href="/projects"
              className="text-xs font-semibold text-brand underline-offset-2 hover:underline"
            >
              Tout voir
            </Link>
          }
        >
          <div className="panel">
            {data.myProjects.length === 0 ? (
              <EmptyState
                compact
                title="Aucun projet"
                description="Tu apparaîtras ici dès qu’on t’ajoute à une équipe."
                action={
                  <Link href="/projects" className="btn btn-secondary">
                    Voir les projets
                  </Link>
                }
              />
            ) : (
              <ul className="stagger-list space-y-1">
                {data.myProjects.map((p) => (
                  <li key={p.id}>
                    <Link href={`/projects/${p.id}`} className="list-row">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-ink">{p.name}</span>
                        <span className="shrink-0 text-xs text-muted">
                          {statusLabel(p.status)} · {p.progressPercent}%
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </SectionBlock>

        <SectionBlock
          index={3}
          title="Mes tâches ouvertes"
          hint="Ce qui te reste à livrer."
          action={
            <Link
              href="/tasks"
              className="text-xs font-semibold text-brand underline-offset-2 hover:underline"
            >
              Tout voir
            </Link>
          }
        >
          <div className="panel">
            {data.myTasks.length === 0 ? (
              <EmptyState
                compact
                title="Aucune tâche ouverte"
                description="Les tâches qui te sont assignées s’affichent ici."
                action={
                  <Link href="/tasks" className="btn btn-secondary">
                    Mes tâches
                  </Link>
                }
              />
            ) : (
              <ul className="stagger-list space-y-1">
                {data.myTasks.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/projects/${t.projectId}/tasks`}
                      className="list-row"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <p className="font-medium text-ink">{t.title}</p>
                        <DueBadge dueDate={t.dueDate} status={t.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted">
                        {t.projectName} · {taskStatusLabel(t.status)} ·{" "}
                        {priorityLabel(t.priority)}
                        {t.dueDate ? (
                          <>
                            {" · "}
                            <span
                              className={dueDateClassName(t.dueDate, t.status)}
                            >
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
        </SectionBlock>
      </div>
    </div>
  );
}
