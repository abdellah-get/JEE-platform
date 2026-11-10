"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import { formatPersonName } from "@/lib/names";
import { queryKeys } from "@/lib/query-keys";
import type { RecruitmentStage } from "@/lib/types";

const STAGES: RecruitmentStage[] = [
  "CANDIDATURE",
  "ENTRETIEN",
  "DECISION",
  "ACCEPTED",
  "REJECTED",
];

const STAGE_LABEL: Record<RecruitmentStage, string> = {
  CANDIDATURE: "Candidature",
  ENTRETIEN: "Entretien",
  DECISION: "Décision",
  ACCEPTED: "Accepté",
  REJECTED: "Refusé",
};

export default function AdminRecruitmentPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [poleName, setPoleName] = useState("");

  const polesQuery = useQuery({
    queryKey: ["recruitment-poles"],
    queryFn: () => api.listPoles(accessToken!),
    enabled: Boolean(accessToken && canAccessAdmin(user?.clubRole)),
  });

  const pipelineQuery = useQuery({
    queryKey: queryKeys.recruitmentPipeline,
    queryFn: () => api.listRecruitmentPipeline(accessToken!),
    enabled: Boolean(accessToken && canAccessAdmin(user?.clubRole)),
  });

  const byStage = useMemo(() => {
    const entries = pipelineQuery.data ?? [];
    const map = Object.fromEntries(
      STAGES.map((s) => [s, [] as typeof entries]),
    ) as Record<RecruitmentStage, typeof entries>;
    for (const e of entries) {
      map[e.stage].push(e);
    }
    return map;
  }, [pipelineQuery.data]);

  const createPole = useMutation({
    mutationFn: () =>
      api.createPole(accessToken!, { name: poleName.trim() }),
    onSuccess: () => {
      setPoleName("");
      toast.success("Pôle créé.");
      void qc.invalidateQueries({ queryKey: ["recruitment-poles"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Création impossible"),
  });

  const move = useMutation({
    mutationFn: ({
      id,
      stage,
      poleId,
      clearPole,
    }: {
      id: string;
      stage: RecruitmentStage;
      poleId?: string;
      clearPole?: boolean;
    }) =>
      api.updateRecruitmentEntry(accessToken!, id, {
        stage,
        poleId: poleId || undefined,
        clearPole,
      }),
    onSuccess: () => {
      toast.success("Pipeline mis à jour.");
      void qc.invalidateQueries({ queryKey: queryKeys.recruitmentPipeline });
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Mise à jour impossible"),
  });

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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          ← Admin
        </Link>
        <h1 className="mt-2 page-title">Recrutement</h1>
        <p className="mt-1 text-sm text-muted">
          Pipeline candidature → entretien → décision, avec pôles.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-3 surface-quiet p-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (poleName.trim()) createPole.mutate();
        }}
      >
        <label className="min-w-[12rem] flex-1 space-y-1 text-sm">
          <span className="font-medium text-ink">Nouveau pôle</span>
          <input
            className="input-field"
            value={poleName}
            onChange={(e) => setPoleName(e.target.value)}
            placeholder="Ex. SI, Commercial…"
            required
          />
        </label>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={createPole.isPending}
        >
          Ajouter
        </button>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          {(polesQuery.data ?? []).map((p) => (
            <span key={p.id} className="chip">
              {p.name}
              {!p.active ? " (inactif)" : ""}
            </span>
          ))}
        </div>
      </form>

      {pipelineQuery.isPending ? (
        <LoadingBlock rows={4} />
      ) : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-5">
          {STAGES.map((stage) => (
            <section key={stage} className="panel min-h-[12rem] space-y-2 p-3">
              <h2 className="text-sm font-semibold text-ink">
                {STAGE_LABEL[stage]}
                <span className="ml-1 text-xs font-normal text-muted">
                  ({byStage[stage].length})
                </span>
              </h2>
              {byStage[stage].length === 0 ? (
                <p className="text-xs text-muted">Vide</p>
              ) : (
                <ul className="space-y-2">
                  {byStage[stage].map((e) => (
                    <li key={e.id} className="surface-quiet space-y-2 p-2 text-sm">
                      <p className="font-medium text-ink">
                        {formatPersonName(e.firstName, e.lastName)}
                      </p>
                      <p className="truncate text-xs text-muted">{e.email}</p>
                      {e.poleName ? (
                        <p className="text-xs text-muted">Pôle : {e.poleName}</p>
                      ) : null}
                      <label className="block space-y-1 text-xs">
                        <span className="text-muted">Étape</span>
                        <select
                          className="input-field text-sm"
                          value={e.stage}
                          disabled={move.isPending}
                          onChange={(ev) =>
                            move.mutate({
                              id: e.id,
                              stage: ev.target.value as RecruitmentStage,
                            })
                          }
                        >
                          {STAGES.map((s) => (
                            <option key={s} value={s}>
                              {STAGE_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="block space-y-1 text-xs">
                        <span className="text-muted">Pôle visé</span>
                        <select
                          className="input-field text-sm"
                          value={e.poleId ?? ""}
                          disabled={move.isPending}
                          onChange={(ev) =>
                            move.mutate({
                              id: e.id,
                              stage: e.stage,
                              poleId: ev.target.value || undefined,
                              clearPole: !ev.target.value,
                            })
                          }
                        >
                          <option value="">—</option>
                          {(polesQuery.data ?? [])
                            .filter((p) => p.active)
                            .map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                        </select>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
