"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthShell } from "@/components/auth/AuthShell";
import { Field } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, user, router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inscription impossible");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || user) {
    return (
      <main className="min-h-screen flex items-center justify-center text-sm text-zinc-500">
        Chargement…
      </main>
    );
  }

  return (
    <AuthShell
      title="Inscription"
      subtitle="Crée ton compte membre JEE ENSEM."
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field
            id="firstName"
            label="Prénom"
            value={firstName}
            onChange={setFirstName}
            autoComplete="given-name"
            required
          />
          <Field
            id="lastName"
            label="Nom"
            value={lastName}
            onChange={setLastName}
            autoComplete="family-name"
            required
          />
        </div>
        <Field
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
        />
        <Field
          id="password"
          label="Mot de passe (min. 8)"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          minLength={8}
        />

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {submitting ? "Création…" : "Créer mon compte"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-600">
        Déjà inscrit ?{" "}
        <Link href="/login" className="font-medium text-zinc-900 underline">
          Se connecter
        </Link>
      </p>
    </AuthShell>
  );
}
