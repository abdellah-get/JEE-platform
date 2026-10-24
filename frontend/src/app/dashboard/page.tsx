"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-zinc-500">
        Chargement…
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              JEE Platform
            </p>
            <h1 className="text-xl font-semibold">Dashboard</h1>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
          >
            Déconnexion
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-3xl space-y-4 px-4 py-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <p className="text-sm text-zinc-500">Connecté en tant que</p>
          <p className="mt-1 text-lg font-medium">
            {user.firstName} {user.lastName}
          </p>
          <p className="text-sm text-zinc-600">{user.email}</p>
          <p className="mt-2 inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium">
            {user.clubRole}
          </p>
        </div>
        <p className="text-sm text-zinc-600">
          Placeholder mission #4 — le vrai tableau de bord arrive en P3 (#18).{" "}
          <Link href="/" className="underline">
            Accueil
          </Link>
        </p>
      </section>
    </main>
  );
}
