"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import { queryKeys } from "@/lib/query-keys";
import type { MissionStatus } from "@/lib/types";

const MISSION_STATUSES: MissionStatus[] = [
  "LEAD",
  "QUOTE",
  "CONTRACT",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];

function formatMoney(cents: number, currency: string) {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default function CrmMissionDetailPage() {
  const params = useParams<{ id: string }>();
  const missionId = params.id;
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const isBureau = canAccessAdmin(user?.clubRole);

  const [quoteAmount, setQuoteAmount] = useState("");
  const [contractAmount, setContractAmount] = useState("");
  const [projectId, setProjectId] = useState("");

  const missionQuery = useQuery({
    queryKey: queryKeys.crmMission(missionId),
    queryFn: () => api.getCrmMission(accessToken!, missionId),
    enabled: Boolean(accessToken && missionId),
  });

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects(0),
    queryFn: () => api.listProjects(accessToken!, 0, 100),
    enabled: Boolean(accessToken),
  });

  const leadsQuery = useQuery({
    queryKey: queryKeys.crmLeads(0),
    queryFn: () => api.listCrmLeads(accessToken!, 0),
    enabled: Boolean(accessToken && isBureau),
  });

  function invalidate() {
    void qc.invalidateQueries({ queryKey: queryKeys.crmMission(missionId) });
    void qc.invalidateQueries({ queryKey: ["crm-missions"] });
  }

  const updateStatus = useMutation({
    mutationFn: (status: MissionStatus) =>
      api.updateCrmMission(accessToken!, missionId, { status }),
    onSuccess: () => {
      toast.success("Statut mis à jour.");
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Mise à jour impossible"),
  });

  const linkProject = useMutation({
    mutationFn: () =>
      api.updateCrmMission(accessToken!, missionId, {
        projectId: projectId || undefined,
        clearProject: !projectId,
      }),
    onSuccess: () => {
      toast.success("Projet lié.");
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Lien impossible"),
  });

  const linkLead = useMutation({
    mutationFn: (leadId: string) =>
      api.updateCrmMission(accessToken!, missionId, {
        leadId: leadId || undefined,
        clearLead: !leadId,
      }),
    onSuccess: () => {
      toast.success("Lead lié.");
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Lien impossible"),
  });

  const addQuote = useMutation({
    mutationFn: () => {
      const amountCents = Math.round(parseFloat(quoteAmount.replace(",", ".")) * 100);
      if (!Number.isFinite(amountCents) || amountCents < 0) {
        throw new ApiError(400, "Montant invalide");
      }
      return api.createCrmQuote(accessToken!, missionId, { amountCents });
    },
    onSuccess: () => {
      setQuoteAmount("");
      toast.success("Devis ajouté.");
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Devis impossible"),
  });

  const addContract = useMutation({
    mutationFn: () => {
      const amountCents = Math.round(
        parseFloat(contractAmount.replace(",", ".")) * 100,
      );
      if (!Number.isFinite(amountCents) || amountCents < 0) {
        throw new ApiError(400, "Montant invalide");
      }
      return api.createCrmContract(accessToken!, missionId, { amountCents });
    },
    onSuccess: () => {
      setContractAmount("");
      toast.success("Contrat ajouté.");
      invalidate();
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Contrat impossible"),
  });

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  if (missionQuery.error && !missionQuery.data) {
    return (
      <EmptyState
        title="Mission introuvable"
        description={
          missionQuery.error instanceof ApiError
            ? missionQuery.error.message
            : "Accès refusé ou mission absente."
        }
        action={
          <Link href="/crm" className="text-sm font-medium underline">
            Retour CRM
          </Link>
        }
      />
    );
  }

  const mission = missionQuery.data;
  if (!mission) {
    return <LoadingBlock label="Chargement de la mission…" />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/crm" className="text-sm text-muted hover:text-ink">
          ← CRM
        </Link>
        <h1 className="mt-2 page-title">{mission.title}</h1>
        <p className="mt-1 text-sm text-muted">
          {mission.description?.trim() || "Pas de description."}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3 surface-quiet p-4">
        <label className="space-y-1 text-sm">
          <span className="font-medium text-ink">Statut</span>
          <select
            className="input-field"
            value={mission.status}
            onChange={(e) =>
              updateStatus.mutate(e.target.value as MissionStatus)
            }
          >
            {MISSION_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-[12rem] flex-1 space-y-1 text-sm">
          <span className="font-medium text-ink">Projet interne</span>
          <select
            className="input-field"
            value={projectId || mission.projectId || ""}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">Aucun</option>
            {(projectsQuery.data?.content ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => linkProject.mutate()}
        >
          Lier projet
        </button>
      </div>

      {isBureau ? (
        <label className="block space-y-1 text-sm surface-quiet p-4">
          <span className="font-medium text-ink">Lead</span>
          <select
            className="input-field"
            value={mission.leadId ?? ""}
            onChange={(e) => linkLead.mutate(e.target.value)}
          >
            <option value="">Aucun</option>
            {(leadsQuery.data?.content ?? []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.companyName}
              </option>
            ))}
          </select>
          {mission.leadCompanyName ? (
            <span className="text-xs text-muted">
              Actuel : {mission.leadCompanyName}
            </span>
          ) : null}
        </label>
      ) : mission.leadCompanyName ? (
        <p className="text-sm text-muted">Lead : {mission.leadCompanyName}</p>
      ) : null}

      <section className="panel space-y-3">
        <h2 className="section-heading">Devis</h2>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addQuote.mutate();
          }}
        >
          <label className="space-y-1 text-sm">
            <span className="font-medium text-ink">Montant (MAD)</span>
            <input
              className="input-field"
              inputMode="decimal"
              value={quoteAmount}
              onChange={(e) => setQuoteAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>
          <button type="submit" className="btn btn-primary" disabled={addQuote.isPending}>
            Ajouter devis
          </button>
        </form>
        {mission.quotes.length === 0 ? (
          <p className="text-sm text-muted">Aucun devis.</p>
        ) : (
          <ul className="space-y-2">
            {mission.quotes.map((q) => (
              <li key={q.id} className="list-row flex justify-between gap-3 text-sm">
                <span>
                  {formatMoney(q.amountCents, q.currency)}
                  {q.validUntil ? ` · valide jusqu’au ${q.validUntil}` : ""}
                </span>
                <span className="chip text-xs">{q.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel space-y-3">
        <h2 className="section-heading">Contrats</h2>
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            addContract.mutate();
          }}
        >
          <label className="space-y-1 text-sm">
            <span className="font-medium text-ink">Montant (MAD)</span>
            <input
              className="input-field"
              inputMode="decimal"
              value={contractAmount}
              onChange={(e) => setContractAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={addContract.isPending}
          >
            Ajouter contrat
          </button>
        </form>
        {mission.contracts.length === 0 ? (
          <p className="text-sm text-muted">Aucun contrat.</p>
        ) : (
          <ul className="space-y-2">
            {mission.contracts.map((c) => (
              <li key={c.id} className="list-row flex justify-between gap-3 text-sm">
                <span>{formatMoney(c.amountCents, c.currency)}</span>
                <span className="chip text-xs">{c.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
