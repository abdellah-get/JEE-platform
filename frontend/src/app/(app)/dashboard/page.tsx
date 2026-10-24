"use client";

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-600">
          Bienvenue, {user.firstName}. Les widgets projets / annonces arrivent en
          P3.
        </p>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <p className="text-sm text-zinc-500">Session</p>
        <p className="mt-1 font-medium">
          {user.firstName} {user.lastName}
        </p>
        <p className="text-sm text-zinc-600">{user.email}</p>
        <p className="mt-2 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium">
          {user.clubRole}
        </p>
      </div>
    </div>
  );
}
