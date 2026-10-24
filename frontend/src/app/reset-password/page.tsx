"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/auth/Field";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }
    // API reset will use ?token=… when email flow is ready.
    setMessage(
      token
        ? "Écran prêt. L’API de reset sera branchée avec l’envoi d’email."
        : "Lien invalide : token manquant dans l’URL.",
    );
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisis un mot de passe sécurisé (min. 8 caractères)."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          id="password"
          label="Nouveau mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          minLength={8}
        />
        <Field
          id="confirm"
          label="Confirmer"
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          required
          minLength={8}
        />

        {message ? (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {message}
          </p>
        ) : null}

        <button
          type="submit"
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Enregistrer
        </button>
        <Link
          href="/login"
          className="block text-center text-sm text-zinc-600 hover:text-zinc-900"
        >
          Retour à la connexion
        </Link>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-sm text-zinc-500">
          Chargement…
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
