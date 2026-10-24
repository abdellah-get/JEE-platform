"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DueBadge } from "@/components/tasks/DueBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { statusLabel } from "@/lib/projects";
import {
  dueDateClassName,
  formatDueDate,
  priorityLabel,
  taskStatusLabel,
} from "@/lib/tasks";
import type { Dashboard } from "@/lib/types";

export default function DashboardPage() {
  const { user, loading, accessToken } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    api
      .getDashboard(accessToken)
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Chargement impossible"),
      );
  }, [accessToken]);

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
        description={error}
        action={
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white"
          >
            Réessayer
          </button>
        }
      />
    );
  }

  if (!data) {
    return <LoadingBlock label="Chargement du dashboard…" />;
  }

  const kpis = data.kpis;
  const isBureau = user.clubRole === "BUREAU" || user.clubRole === "ADMIN_TECH";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Bonjour {user.firstName}. Vue {user.clubRole.toLowerCase()}.
          </p>
        </div>
        {isBureau && (
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60"
          >
            {exporting ? "Export…" : "Exporter CSV"}
          </button>
        )}
      </div>

      {data.pinnedAnnouncements.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
            Annonces urgentes
          </h2>
          <ul className="space-y-2">
            {data.pinnedAnnouncements.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/announcements/${a.id}`}
                  className="block rounded-xl border border-amber-300 bg-amber-50 p-4 hover:shadow-sm"
                >
                  <p className="font-medium text-zinc-900">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-700">{a.body}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {kpis && (
        <section className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              ["Membres actifs", kpis.activeMembers],
              ["Projets", kpis.totalProjects],
              ["Projets actifs", kpis.activeProjects],
              ["Tâches ouvertes", kpis.openTasks],
              ["Pins urgents", kpis.pinnedAnnouncements],
            ].map(([label, value]) => (
              <div
                key={String(label)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
              >
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 sm:col-span-2 lg:col-span-1">
              <p className="text-xs text-zinc-500">Projets par statut</p>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Brouillon</dt>
                  <dd className="font-medium">{kpis.projectsBrouillon}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Actif</dt>
                  <dd className="font-medium">{kpis.projectsActif}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Terminé</dt>
                  <dd className="font-medium">{kpis.projectsTermine}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-zinc-500">Archivé</dt>
                  <dd className="font-medium">{kpis.projectsArchive}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <p className="text-xs text-zinc-500">Avancement moyen</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">
                {kpis.averageProgressPercent}%
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3">
              <p className="text-xs text-zinc-500">Tâches en retard</p>
              <p
                className={`mt-1 text-2xl font-semibold tracking-tight ${
                  kpis.overdueTasks > 0 ? "text-red-700" : ""
                }`}
              >
                {kpis.overdueTasks}
              </p>
            </div>
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Mes projets</h2>
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
                    className="flex items-center justify-between rounded-lg px-2 py-2 text-sm hover:bg-zinc-50"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-zinc-500">
                      {statusLabel(p.status)} · {p.progressPercent}%
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900">Mes tâches ouvertes</h2>
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
                    className="block rounded-lg px-2 py-2 text-sm hover:bg-zinc-50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{t.title}</p>
                      <DueBadge dueDate={t.dueDate} status={t.status} />
                    </div>
                    <p className="text-xs text-zinc-500">
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
