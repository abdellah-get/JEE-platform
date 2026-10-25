"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/auth/Field";
import { ApiError, forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Envoi impossible");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="On t’envoie un lien sécurisé pour choisir un nouveau mot de passe."
    >
      {sent ? (
        <div className="space-y-4 text-sm text-ink/80">
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900">
            Si un compte existe pour <strong>{email}</strong>, un email avec un
            lien de réinitialisation a été envoyé (valide 1 h). En local, le
            lien apparaît aussi dans les logs du backend.
          </p>
          <Link href="/login" className="block text-center font-medium underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
            error={error}
          />
          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full"
          >
            {submitting ? "Envoi…" : "Envoyer le lien"}
          </button>
          <Link
            href="/login"
            className="block text-center text-sm text-muted hover:text-ink"
          >
            Retour
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
