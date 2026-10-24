"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin, canManageClubRoles } from "@/lib/auth-storage";
import type { AdminUser, ClubRole } from "@/lib/types";

const ROLES: ClubRole[] = ["MEMBRE", "BUREAU", "ADMIN_TECH"];

export default function AdminRolesPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [listBusy, setListBusy] = useState(true);

  const canEdit = canManageClubRoles(user?.clubRole);

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

  async function onRoleChange(target: AdminUser, clubRole: ClubRole) {
    if (clubRole === target.clubRole) return;
    setError(null);
    setBusyId(target.userId);
    try {
      const updated = await api.updateUserClubRole(
        accessToken!,
        target.userId,
        clubRole,
      );
      setUsers((prev) =>
        prev.map((u) => (u.userId === updated.userId ? updated : u)),
      );
      toast.success(`Rôle mis à jour : ${clubRole}.`);
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
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Rôles club</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {canEdit
            ? "Attribue MEMBRE, BUREAU ou ADMIN_TECH."
            : "Lecture seule — seul l’admin technique peut modifier les rôles."}
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {listBusy ? (
        <LoadingBlock label="Chargement des rôles…" />
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
                    <span className="ml-2 text-xs text-zinc-500">(inactif)</span>
                  )}
                </p>
                <p className="text-xs text-zinc-500">{u.email}</p>
              </div>
              {canEdit ? (
                <select
                  value={u.clubRole}
                  disabled={busyId === u.userId}
                  onChange={(e) => onRoleChange(u, e.target.value as ClubRole)}
                  className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm disabled:opacity-50"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium">
                  {u.clubRole}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
