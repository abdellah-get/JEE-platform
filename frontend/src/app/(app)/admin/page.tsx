"use client";

import Link from "next/link";

import { useAuth } from "@/context/AuthContext";
import { canAccessAdmin, canManageClubRoles } from "@/lib/auth-storage";

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  if (!canAccessAdmin(user?.clubRole)) {
    return (
      <p className="text-sm text-red-700">
        Accès réservé au bureau / admin technique.
      </p>
    );
  }

  const rolesOk = canManageClubRoles(user?.clubRole);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Gestion des comptes club et des rôles.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/members"
          className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
        >
          <p className="font-medium text-zinc-900">Membres</p>
          <p className="mt-1 text-sm text-zinc-600">
            Activer ou désactiver les comptes (bureau).
          </p>
        </Link>
        <Link
          href="/admin/roles"
          className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-300 hover:shadow-sm"
        >
          <p className="font-medium text-zinc-900">Rôles club</p>
          <p className="mt-1 text-sm text-zinc-600">
            {rolesOk
              ? "Promouvoir MEMBRE / BUREAU / ADMIN_TECH."
              : "Réservé à l’admin technique."}
          </p>
        </Link>
      </div>
    </div>
  );
}
