"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/auth/Field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    // Backend email reset (Brevo) arrives in a later mission — UI ready.
    setSent(true);
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Indique ton email pour recevoir un lien de réinitialisation."
    >
      {sent ? (
        <div className="space-y-4 text-sm text-zinc-700">
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-amber-900">
            Si un compte existe pour <strong>{email}</strong>, un email sera
            envoyé. L’envoi réel sera branché avec le service mail (Brevo) —
            l’écran est déjà prêt.
          </p>
          <Link href="/login" className="block text-center font-medium underline">
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Field
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Envoyer le lien
          </button>
          <Link
            href="/login"
            className="block text-center text-sm text-zinc-600 hover:text-zinc-900"
          >
            Retour
          </Link>
        </form>
      )}
    </AuthShell>
  );
}
