"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";

function PendingContent() {
  const searchParams = useSearchParams();
  const msg = searchParams.get("msg");

  return (
    <AuthShell
      title="Demande en cours"
      subtitle="Le bureau traite les inscriptions avant d’ouvrir la plateforme."
    >
      <div className="space-y-4 text-sm text-ink">
        <p>
          {msg?.trim() ||
            "Ta demande d’adhésion a bien été reçue. Tu recevras l’accès dès qu’un membre du bureau l’aura acceptée."}
        </p>
        <p className="text-muted">
          En attendant, la connexion reste bloquée — c’est normal. Pas besoin de
          renvoyer le formulaire.
        </p>
        <div className="flex flex-col gap-2 pt-2">
          <Link href="/login" className="btn btn-primary w-full text-center">
            Retour à la connexion
          </Link>
          <Link
            href="/"
            className="block text-center text-sm font-medium text-muted underline"
          >
            Accueil
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

export default function PendingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-sm text-muted">
          Chargement…
        </main>
      }
    >
      <PendingContent />
    </Suspense>
  );
}
