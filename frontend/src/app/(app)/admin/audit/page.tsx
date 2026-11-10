"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import { queryKeys } from "@/lib/query-keys";

const ACTIONS = [
  "",
  "USER_ACTIVATE",
  "USER_DEACTIVATE",
  "MEMBERSHIP_APPROVE",
  "MEMBERSHIP_REJECT",
  "USER_ROLE_CHANGE",
] as const;

export default function AdminAuditPage() {
  const { accessToken, user, loading } = useAuth();
  const [page, setPage] = useState(0);
  const [action, setAction] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const { data, error, isPending } = useQuery({
    queryKey: queryKeys.auditEvents({ page, action, from, to }),
    queryFn: () =>
      api.listAuditEvents(accessToken!, {
        page,
        action: action || undefined,
        from: from || undefined,
        to: to || undefined,
      }),
    enabled: Boolean(accessToken && canAccessAdmin(user?.clubRole)),
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

  const errorMessage =
    error instanceof ApiError ? error.message : error ? "Chargement impossible" : null;
  const items = data?.content ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          ← Admin
        </Link>
        <h1 className="mt-2 page-title">Journal d’audit</h1>
        <p className="mt-1 text-sm text-muted">
          Actions sensibles (adhésion, activation, rôles) — sans secrets.
        </p>
      </div>

      <form
        className="flex flex-wrap items-end gap-3 surface-quiet p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
        }}
      >
        <label className="space-y-1 text-sm">
          <span className="font-medium text-ink">Action</span>
          <select
            className="input-field"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Toutes</option>
            {ACTIONS.filter(Boolean).map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-ink">Du</span>
          <input
            type="date"
            className="input-field"
            value={from}
            onChange={(e) => {
              setFrom(e.target.value);
              setPage(0);
            }}
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium text-ink">Au</span>
          <input
            type="date"
            className="input-field"
            value={to}
            onChange={(e) => {
              setTo(e.target.value);
              setPage(0);
            }}
          />
        </label>
      </form>

      {errorMessage ? (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      ) : null}

      {isPending ? (
        <LoadingBlock label="Chargement du journal…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune entrée"
          description="Les actions admin apparaîtront ici."
        />
      ) : (
        <>
          <ul className="divide-y divide-line surface-quiet">
            {items.map((e) => (
              <li key={e.id} className="space-y-1 px-4 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="chip" data-tone="moyenne">
                    {e.action}
                  </span>
                  <time className="text-xs text-muted" dateTime={e.createdAt}>
                    {new Date(e.createdAt).toLocaleString("fr-FR")}
                  </time>
                </div>
                <p className="font-medium text-ink">{e.summary}</p>
                <p className="text-xs text-muted">
                  {e.actorEmail}
                  {e.targetId ? ` · cible ${e.targetType} ${e.targetId.slice(0, 8)}…` : ""}
                </p>
              </li>
            ))}
          </ul>
          <PaginationBar
            page={data?.page ?? page}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
