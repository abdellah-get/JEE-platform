"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import { formatPersonName } from "@/lib/names";
import type { AdminUser } from "@/lib/types";

export default function AdminRequestsPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const [requests, setRequests] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [listBusy, setListBusy] = useState(true);

  useEffect(() => {
    if (!accessToken || !canAccessAdmin(user?.clubRole)) return;
    setListBusy(true);
    setError(null);
    api
      .listAdminUsers(accessToken, 0, 100, "PENDING")
      .then((page) =>
        setRequests(
          page.content.filter((u) => u.membershipStatus === "PENDING"),
        ),
      )
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return;
        setError(err instanceof ApiError ? err.message : "Chargement impossible");
      })
      .finally(() => setListBusy(false));
  }, [accessToken, user?.clubRole]);

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

  async function decide(target: AdminUser, decision: "APPROVE" | "REJECT") {
    setError(null);
    setBusyId(target.userId);
    try {
      await api.decideMembership(accessToken!, target.userId, decision);
      setRequests((prev) => prev.filter((u) => u.userId !== target.userId));
      toast.success(
        decision === "APPROVE"
          ? "Demande acceptée. Cette personne peut se connecter."
          : "Demande refusée. Cette personne ne peut pas accéder à la plateforme.",
      );
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Mise à jour impossible";
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          ← Admin
        </Link>
        <h1 className="mt-2 page-title">Demandes d’adhésion</h1>
        <p className="mt-1 text-sm text-muted">
          Chaque demande montre le nom complet et l’email académique. Accepter
          ouvre l’accès. Refuser le ferme.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      {listBusy ? (
        <LoadingBlock label="Chargement des demandes…" />
      ) : requests.length === 0 ? (
        <EmptyState
          title="Aucune demande"
          description="Les nouvelles inscriptions apparaîtront ici."
        />
      ) : (
        <ul className="divide-y divide-line surface-quiet">
          {requests.map((u) => {
            const busy = busyId === u.userId;
            return (
              <li
                key={u.userId}
                aria-busy={busy}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {formatPersonName(u.firstName, u.lastName)}
                    <span className="chip ml-2">En attente</span>
                  </p>
                  <p className="text-sm text-muted">{u.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busy}
                    onClick={() => decide(u, "APPROVE")}
                  >
                    Accepter
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={() => decide(u, "REJECT")}
                  >
                    Refuser
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
