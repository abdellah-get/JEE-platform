"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import { formatPersonName } from "@/lib/names";
import { queryKeys } from "@/lib/query-keys";
import type { TaskPriority } from "@/lib/types";

export default function AdminWorkloadPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const [projectId, setProjectId] = useState("");
  const [priority, setPriority] = useState<"" | TaskPriority>("");
  const [exporting, setExporting] = useState(false);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(0),
    queryFn: () => api.listProjects(accessToken!, 0, 100),
    enabled: Boolean(accessToken && canAccessAdmin(user?.clubRole)),
  });

  const filters = {
    projectId: projectId || undefined,
    priority: priority || undefined,
  };

  const workloadQuery = useQuery({
    queryKey: queryKeys.workload(filters),
    queryFn: () => api.getWorkload(accessToken!, filters),
    enabled: Boolean(accessToken && canAccessAdmin(user?.clubRole)),
  });

  async function handleExport() {
    if (!accessToken || exporting) return;
    setExporting(true);
    try {
      await api.downloadWorkloadExportCsv(accessToken, filters);
      toast.success("Export charge téléchargé.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Export impossible");
    } finally {
      setExporting(false);
    }
  }

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  if (!canAccessAdmin(user.clubRole)) {
    return (
      <EmptyState
        title="Accès refusé"
        description="Réservé au bureau / admin technique."
        action={
          <Link href="/dashboard" className="text-sm font-medium underline">
            Retour au dashboard
          </Link>
        }
      />
    );
  }

  const data = workloadQuery.data;
  const members = data?.members ?? [];
  const error =
    workloadQuery.error instanceof ApiError
      ? workloadQuery.error.message
      : workloadQuery.error
        ? "Chargement impossible"
        : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          ← Admin
        </Link>
        <h1 className="mt-2 page-title">Charge membres</h1>
        <p className="mt-1 text-sm text-muted">
          Tâches ouvertes et en retard, tous projets confondus.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 surface-quiet p-4">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-ink">Projet</span>
          <select
            className="input-field"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Tous</option>
            {(projectsQuery.data?.content ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-ink">Priorité</span>
          <select
            className="input-field"
            value={priority}
            onChange={(e) => setPriority(e.target.value as "" | TaskPriority)}
          >
            <option value="">Toutes</option>
            <option value="HIGH">Haute</option>
            <option value="MEDIUM">Moyenne</option>
            <option value="LOW">Basse</option>
          </select>
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={exporting}
          onClick={() => void handleExport()}
        >
          {exporting ? "Export…" : "Export CSV"}
        </button>
      </div>

      {data ? (
        <p className="text-sm text-muted">
          {data.totalOpenTasks} ouvertes · {data.totalOverdueTasks} en retard
        </p>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {workloadQuery.isPending ? (
        <LoadingBlock label="Calcul de la charge…" rows={4} />
      ) : members.length === 0 ? (
        <EmptyState
          title="Aucune tâche ouverte assignée"
          description="Change les filtres ou assigne des tâches aux membres."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-3 font-medium">Membre</th>
                <th className="py-2 pr-3 font-medium">Ouvertes</th>
                <th className="py-2 pr-3 font-medium">Retard</th>
                <th className="py-2 pr-3 font-medium">Haute prio</th>
                <th className="py-2 font-medium">Projets</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => {
                const heat =
                  m.overdueTasks >= 5
                    ? "bg-danger/15"
                    : m.overdueTasks >= 2
                      ? "bg-amber-500/10"
                      : m.openTasks >= 8
                        ? "bg-brand-soft/60"
                        : "";
                return (
                  <tr
                    key={m.userId ?? m.email}
                    className={`border-b border-line/70 ${heat}`}
                  >
                    <td className="py-2.5 pr-3">
                      <span className="font-medium text-ink">
                        {formatPersonName(m.firstName, m.lastName)}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {m.email}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">{m.openTasks}</td>
                    <td className="py-2.5 pr-3 tabular-nums font-medium text-danger">
                      {m.overdueTasks}
                    </td>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {m.highPriorityOpen}
                    </td>
                    <td className="py-2.5 tabular-nums">{m.projectCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
