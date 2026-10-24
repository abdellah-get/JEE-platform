"use client";

import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm">
        <p>
          <span className="text-zinc-500">Nom :</span> {user.firstName}{" "}
          {user.lastName}
        </p>
        <p className="mt-2">
          <span className="text-zinc-500">Email :</span> {user.email}
        </p>
        <p className="mt-2">
          <span className="text-zinc-500">Rôle club :</span> {user.clubRole}
        </p>
        <p className="mt-4 text-zinc-500">
          Édition + changement MDP = mission #6 (API /me).
        </p>
      </div>
    </div>
  );
}
