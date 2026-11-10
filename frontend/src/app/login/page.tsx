"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

function LoginForm() {
  const { login, verifyTwoFactor, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [preAuthToken, setPreAuthToken] = useState<string | null>(null);
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
      if (preAuthToken) {
        await verifyTwoFactor(preAuthToken, totpCode.trim());
        router.replace(next.startsWith("/") ? next : "/dashboard");
        return;
      }
      const result = await login(email.trim(), password);
      if (result.requiresTwoFactor && result.preAuthToken) {
        setPreAuthToken(result.preAuthToken);
        return;
      }
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
      title={preAuthToken ? "Vérification 2FA" : "Bon retour"}
      subtitle={
        preAuthToken
          ? "Saisis le code de ton application d’authentification (ou un code de récupération)."
          : "Connecte-toi pour reprendre projets, tâches et annonces."
      }
    >
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {!preAuthToken ? (
          <>
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
          </>
        ) : (
          <Field
            id="totp"
            label="Code 2FA"
            type="text"
            value={totpCode}
            onChange={setTotpCode}
            autoComplete="one-time-code"
            required
            describedBy={error ? "login-error" : undefined}
            invalid={!!error}
          />
        )}

        {error ? (
          <div
            id="login-error"
            role="alert"
            className="space-y-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            <p>{error}</p>
            {/attente|pending|refus/i.test(error) ? (
              <p>
                <Link href="/pending" className="font-medium underline">
                  Voir le statut d’une demande en attente
                </Link>
              </p>
            ) : null}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="btn btn-primary w-full"
        >
          {submitting
            ? "…"
            : preAuthToken
              ? "Valider le code"
              : "Se connecter"}
        </button>

        {preAuthToken ? (
          <button
            type="button"
            className="btn btn-secondary w-full"
            onClick={() => {
              setPreAuthToken(null);
              setTotpCode("");
              setError(null);
            }}
          >
            Retour
          </button>
        ) : (
          <p className="text-center text-sm text-muted">
            <Link href="/forgot-password" className="underline">
              Mot de passe oublié ?
            </Link>
          </p>
        )}
      </form>
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
