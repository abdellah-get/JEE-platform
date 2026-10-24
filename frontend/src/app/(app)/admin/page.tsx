"use client";

import { useAuth } from "@/context/AuthContext";
import { canAccessAdmin } from "@/lib/auth-storage";

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

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Administration</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Placeholder — gestion membres et rôles en P1 (mission #12).
      </p>
    </div>
  );
}
