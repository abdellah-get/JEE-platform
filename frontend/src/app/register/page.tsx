"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import { splitFullName } from "@/lib/names";

const ACADEMIC_EMAIL_ERROR = "Utilise ton email académique (@ensem.ac.ma).";

function isAcademicEmail(value: string): boolean {
  const trimmed = value.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0 || at !== trimmed.lastIndexOf("@")) return false;
  const domain = trimmed.slice(at + 1).toLowerCase();
  return domain === "ensem.ac.ma" || domain === "ensem.jee";
}

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPendingMessage(null);

    if (!isAcademicEmail(email)) {
      setError(ACADEMIC_EMAIL_ERROR);
      return;
    }

    setSubmitting(true);
    try {
      const { firstName, lastName } = splitFullName(fullName);
      const result = await register({
        email: email.trim(),
        password,
        firstName,
        lastName,
      });
      if (result.pendingApproval) {
        setPendingMessage(result.message);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inscription impossible");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-muted">
        Chargement…
      </main>
    );
  }

  return (
    <AuthShell
      title="Inscription"
      subtitle="Rejoins le club avec ton nom complet et ton email académique."
    >
      {pendingMessage ? (
        <div className="space-y-4">
          <div className="rounded-lg border border-line bg-surface px-4 py-4 text-sm text-ink">
            <h2 className="font-semibold">Demande envoyée</h2>
            <p className="mt-2">{pendingMessage}</p>
            <p className="mt-2">
              Tant que le bureau n’a pas accepté, tu ne peux pas entrer dans la plateforme.
            </p>
          </div>
          <Link
            href="/login"
            className="block text-center text-sm font-medium text-ink underline"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field
            id="fullName"
            label="Nom complet"
            value={fullName}
            onChange={setFullName}
            autoComplete="name"
            required
            describedBy={error ? "register-error" : undefined}
            invalid={!!error}
          />
          <label className="block space-y-1.5" htmlFor="email">
            <span className="text-sm font-semibold text-ink">Email académique</span>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="prenom.nom@ensem.ac.ma"
              required
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "register-error" : undefined}
              className="input-field"
            />
          </label>
          <Field
            id="password"
            label="Mot de passe (min. 8)"
            type="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            required
            minLength={8}
            describedBy={error ? "register-error" : undefined}
            invalid={!!error}
          />

          {error ? (
            <p
              id="register-error"
              role="alert"
              className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full"
          >
            {submitting ? "Envoi…" : "Envoyer ma demande"}
          </button>
        </form>
      )}

      {!pendingMessage ? (
        <p className="mt-4 text-center text-sm text-muted">
          Déjà inscrit ?{" "}
          <Link href="/login" className="font-medium text-ink underline">
            Se connecter
          </Link>
        </p>
      ) : null}
    </AuthShell>
  );
}
