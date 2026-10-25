"use client";

import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { canAccessAdmin, canManageClubRoles } from "@/lib/auth-storage";

export default function AdminPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingBlock />;
  }

  if (!canAccessAdmin(user?.clubRole)) {
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

  const rolesOk = canManageClubRoles(user?.clubRole);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="page-title">Administration</h1>
        <p className="mt-1 text-sm text-muted">
          Gestion des comptes club et des rôles.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/admin/members"
          className="surface-quiet p-5 transition hover:border-line hover:shadow-sm"
        >
          <p className="font-medium text-ink">Membres</p>
          <p className="mt-1 text-sm text-muted">
            Activer ou désactiver les comptes (bureau).
          </p>
        </Link>
        <Link
          href="/admin/roles"
          className="surface-quiet p-5 transition hover:border-line hover:shadow-sm"
        >
          <p className="font-medium text-ink">Rôles club</p>
          <p className="mt-1 text-sm text-muted">
            {rolesOk
              ? "Promouvoir MEMBRE / BUREAU / ADMIN_TECH."
              : "Réservé à l’admin technique."}
          </p>
        </Link>
      </div>
    </div>
  );
}
