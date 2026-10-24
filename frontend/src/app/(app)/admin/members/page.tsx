"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import type { AdminUser } from "@/lib/types";

export default function AdminMembersPage() {
  const { accessToken, user, loading } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || !canAccessAdmin(user?.clubRole)) return;
    api
      .listAdminUsers(accessToken)
      .then(setUsers)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Chargement impossible"),
      );
  }, [accessToken, user?.clubRole]);

  if (loading || !user || !accessToken) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  if (!canAccessAdmin(user.clubRole)) {
    return (
      <p className="text-sm text-red-700">
        Accès réservé au bureau / admin technique.
      </p>
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
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mise à jour impossible");
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
          Active ou désactive les comptes du club.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

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
                  <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-700">
                    Inactif
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
    </div>
  );
}
