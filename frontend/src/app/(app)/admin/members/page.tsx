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
import type { AdminUser } from "@/lib/types";

export default function AdminMembersPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [listBusy, setListBusy] = useState(true);

  useEffect(() => {
    if (!accessToken || !canAccessAdmin(user?.clubRole)) return;
    setListBusy(true);
    api
      .listAdminUsers(accessToken)
      .then(setUsers)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Chargement impossible"),
      )
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

  async function toggleActive(target: AdminUser) {
    setError(null);
    setBusyId(target.userId);
    try {
      const updated = await api.updateUserActive(
        accessToken!,
        target.userId,
        !target.active,
      );
      setUsers((prev) =>
        prev.map((u) => (u.userId === updated.userId ? updated : u)),
      );
      toast.success(updated.active ? "Compte activé." : "Compte désactivé.");
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
        <Link href="/admin" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Membres</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Active ou désactive les comptes. Les inscriptions en attente
          d&apos;approbation apparaissent comme <em>Inactif</em> — clique{" "}
          <strong>Activer</strong> pour les valider.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {listBusy ? (
        <LoadingBlock label="Chargement des membres…" />
      ) : users.length === 0 ? (
        <EmptyState title="Aucun membre" description="Aucun compte enregistré." />
      ) : (
        <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200 bg-white">
          {users.map((u) => (
            <li
              key={u.userId}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {u.firstName} {u.lastName}
                  {!u.active && (
                    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800">
                      En attente / inactif
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">
                  {u.email} · {u.clubRole}
                </p>
              </div>
              <button
                type="button"
                disabled={busyId === u.userId || u.userId === user.userId}
                onClick={() => toggleActive(u)}
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-50 disabled:opacity-50"
              >
                {busyId === u.userId
                  ? "…"
                  : u.active
                    ? "Désactiver"
                    : "Activer"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
