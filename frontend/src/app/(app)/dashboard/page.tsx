"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { DueBadge } from "@/components/tasks/DueBadge";
import { useAuth } from "@/context/AuthContext";
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
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    api
      .getDashboard(accessToken)
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Chargement impossible"),
      );
  }, [accessToken]);

  if (loading || !user || !accessToken) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  if (error && !data) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Bonjour {user.firstName}. Vue {user.clubRole.toLowerCase()}.
        </p>
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

      {data.kpis && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["Membres actifs", data.kpis.activeMembers],
            ["Projets", data.kpis.totalProjects],
            ["Projets actifs", data.kpis.activeProjects],
            ["Tâches ouvertes", data.kpis.openTasks],
            ["Pins urgents", data.kpis.pinnedAnnouncements],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3"
            >
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
            </div>
          ))}
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
            <p className="text-sm text-zinc-600">Aucun projet.</p>
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
            <p className="text-sm text-zinc-600">Aucune tâche ouverte.</p>
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
