"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/auth/Field";
import { ApiError, resetPassword } from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setConfirmError(null);
    if (!token) {
      setError("Lien invalide : token manquant dans l’URL.");
      return;
    }
    if (password !== confirm) {
      setConfirmError("Les mots de passe ne correspondent pas.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await resetPassword({ token, password });
      setSuccess(res.message);
      setTimeout(() => router.replace("/login"), 1500);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Réinitialisation impossible",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisis un mot de passe sécurisé (min. 8 caractères)."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          id="password"
          label="Nouveau mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          minLength={8}
          describedBy={error ? "reset-error" : undefined}
          invalid={!!error}
        />
        <Field
          id="confirm"
          label="Confirmer"
          type="password"
          value={confirm}
          onChange={(v) => {
            setConfirm(v);
            setConfirmError(null);
          }}
          autoComplete="new-password"
          required
          minLength={8}
          error={confirmError}
          describedBy={error ? "reset-error" : undefined}
          invalid={!!error || !!confirmError}
        />

        {error ? (
          <p
            id="reset-error"
            role="alert"
            className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !token}
          className="btn btn-primary w-full"
        >
          {submitting ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Link
          href="/login"
          className="block text-center text-sm text-muted hover:text-ink"
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
        <main className="min-h-screen flex items-center justify-center text-sm text-muted">
          Chargement…
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
