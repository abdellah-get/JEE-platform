"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(next.startsWith("/") ? next : "/dashboard");
    }
  }, [loading, user, router, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(next.startsWith("/") ? next : "/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible");
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
      title="Bon retour"
      subtitle="Connecte-toi pour reprendre projets, tâches et annonces."
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
          describedBy={error ? "login-error" : undefined}
          invalid={!!error}
        />
        <Field
          id="password"
          label="Mot de passe"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          required
          describedBy={error ? "login-error" : undefined}
          invalid={!!error}
        />

        {error ? (
          <p
            id="login-error"
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
          {submitting ? "Connexion…" : "Continuer"}
        </button>
      </form>

      <div className="mt-5 flex flex-col gap-2.5 text-center text-sm text-muted">
        <Link href="/forgot-password" className="hover:text-brand">
          Mot de passe oublié ?
        </Link>
        <p>
          Nouveau membre ?{" "}
          <Link href="/register" className="font-semibold text-brand underline-offset-2 hover:underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-sm text-muted">
          Chargement…
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
