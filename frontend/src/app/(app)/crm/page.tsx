"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import { queryKeys } from "@/lib/query-keys";
import type { LeadStatus, MissionStatus } from "@/lib/types";

const MISSION_STATUSES: MissionStatus[] = [
  "LEAD",
  "QUOTE",
  "CONTRACT",
  "IN_PROGRESS",
  "DONE",
  "CANCELLED",
];

const LEAD_STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "LOST"];

export default function CrmPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const isBureau = canAccessAdmin(user?.clubRole);

  const [tab, setTab] = useState<"missions" | "leads">("missions");
  const [missionPage, setMissionPage] = useState(0);
  const [leadPage, setLeadPage] = useState(0);
  const [missionStatus, setMissionStatus] = useState<"" | MissionStatus>("");
  const [leadStatus, setLeadStatus] = useState<"" | LeadStatus>("");

  const [missionTitle, setMissionTitle] = useState("");
  const [companyName, setCompanyName] = useState("");

  const missionsQuery = useQuery({
    queryKey: queryKeys.crmMissions(missionPage, missionStatus || undefined),
    queryFn: () =>
      api.listCrmMissions(
        accessToken!,
        missionPage,
        missionStatus || undefined,
      ),
    enabled: Boolean(accessToken),
  });

  const leadsQuery = useQuery({
    queryKey: queryKeys.crmLeads(leadPage, leadStatus || undefined),
    queryFn: () =>
      api.listCrmLeads(accessToken!, leadPage, leadStatus || undefined),
    enabled: Boolean(accessToken && isBureau && tab === "leads"),
  });

  const createMission = useMutation({
    mutationFn: () =>
      api.createCrmMission(accessToken!, { title: missionTitle.trim() }),
    onSuccess: (m) => {
      setMissionTitle("");
      toast.success("Mission créée.");
      void qc.invalidateQueries({ queryKey: ["crm-missions"] });
      window.location.href = `/crm/missions/${m.id}`;
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Création impossible"),
  });

  const createLead = useMutation({
    mutationFn: () =>
      api.createCrmLead(accessToken!, { companyName: companyName.trim() }),
    onSuccess: () => {
      setCompanyName("");
      toast.success("Lead créé.");
      void qc.invalidateQueries({ queryKey: ["crm-leads"] });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Création impossible"),
  });

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  const missions = missionsQuery.data?.content ?? [];
  const leads = leadsQuery.data?.content ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">CRM missions</h1>
        <p className="mt-1 text-sm text-muted">
          Pipeline commercial JE — leads, devis et contrats.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          className={`btn ${tab === "missions" ? "btn-primary" : "btn-secondary"}`}
          onClick={() => setTab("missions")}
        >
          Missions
        </button>
        {isBureau ? (
          <button
            type="button"
            className={`btn ${tab === "leads" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("leads")}
          >
            Leads
          </button>
        ) : null}
      </div>

      {tab === "missions" ? (
        <>
          <form
            className="flex flex-wrap items-end gap-3 surface-quiet p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (missionTitle.trim()) createMission.mutate();
            }}
          >
            <label className="min-w-[12rem] flex-1 space-y-1 text-sm">
              <span className="font-medium text-ink">Nouvelle mission</span>
              <input
                className="input-field"
                value={missionTitle}
                onChange={(e) => setMissionTitle(e.target.value)}
                placeholder="Titre de la mission"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-ink">Statut</span>
              <select
                className="input-field"
                value={missionStatus}
                onChange={(e) => {
                  setMissionStatus(e.target.value as "" | MissionStatus);
                  setMissionPage(0);
                }}
              >
                <option value="">Tous</option>
                {MISSION_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMission.isPending || !missionTitle.trim()}
            >
              Créer
            </button>
          </form>

          {missionsQuery.isPending ? (
            <LoadingBlock rows={3} />
          ) : missionsQuery.error ? (
            <EmptyState
              title="CRM indisponible"
              description={
                missionsQuery.error instanceof ApiError
                  ? missionsQuery.error.message
                  : "Impossible de charger les missions."
              }
            />
          ) : missions.length === 0 ? (
            <EmptyState
              title="Aucune mission"
              description="Crée une mission pour démarrer le pipeline."
            />
          ) : (
            <ul className="space-y-2">
              {missions.map((m) => (
                <li key={m.id}>
                  <Link
                    href={`/crm/missions/${m.id}`}
                    className="surface-interactive block p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium text-ink">{m.title}</p>
                      <span className="chip text-xs">{m.status}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {m.leadCompanyName
                        ? m.leadCompanyName
                        : "Sans lead"}
                      {m.projectName ? ` · Projet ${m.projectName}` : ""}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {missionsQuery.data ? (
            <PaginationBar
              page={missionPage}
              totalPages={missionsQuery.data.totalPages}
              totalElements={missionsQuery.data.totalElements}
              onPageChange={setMissionPage}
            />
          ) : null}
        </>
      ) : (
        <>
          <form
            className="flex flex-wrap items-end gap-3 surface-quiet p-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (companyName.trim()) createLead.mutate();
            }}
          >
            <label className="min-w-[12rem] flex-1 space-y-1 text-sm">
              <span className="font-medium text-ink">Nouveau lead</span>
              <input
                className="input-field"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Entreprise"
                required
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-ink">Statut</span>
              <select
                className="input-field"
                value={leadStatus}
                onChange={(e) => {
                  setLeadStatus(e.target.value as "" | LeadStatus);
                  setLeadPage(0);
                }}
              >
                <option value="">Tous</option>
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createLead.isPending || !companyName.trim()}
            >
              Créer
            </button>
          </form>

          {leadsQuery.isPending ? (
            <LoadingBlock rows={3} />
          ) : leads.length === 0 ? (
            <EmptyState
              title="Aucun lead"
              description="Ajoute un prospect pour alimenter le pipeline."
            />
          ) : (
            <ul className="space-y-2">
              {leads.map((l) => (
                <li key={l.id} className="surface-quiet p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium text-ink">{l.companyName}</p>
                    <span className="chip text-xs">{l.status}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {[l.contactName, l.contactEmail].filter(Boolean).join(" · ") ||
                      "Contact non renseigné"}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {leadsQuery.data ? (
            <PaginationBar
              page={leadPage}
              totalPages={leadsQuery.data.totalPages}
              totalElements={leadsQuery.data.totalElements}
              onPageChange={setLeadPage}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
