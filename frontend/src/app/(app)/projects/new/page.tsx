"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Field } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { PROJECT_STATUSES, canCreateProject, statusLabel } from "@/lib/projects";
import type { ProjectStatus, UserSummary } from "@/lib/types";

export default function NewProjectPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("BROUILLON");
  const [chefUserId, setChefUserId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken || !user || !canCreateProject(user.clubRole)) return;
    api
      .listUsers(accessToken)
      .then(setUsers)
      .catch(() => setUsers([]));
  }, [accessToken, user]);

  if (loading || !user || !accessToken) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  if (!canCreateProject(user.clubRole)) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Accès refusé</h1>
        <p className="text-sm text-zinc-600">
          Seul le bureau peut créer un projet.
        </p>
        <Link href="/projects" className="text-sm font-medium text-zinc-900 underline">
          Retour aux projets
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const project = await api.createProject(accessToken!, {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        chefUserId: chefUserId || undefined,
      });
      toast.success("Projet créé.");
      router.push(`/projects/${project.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Création impossible";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/projects" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Projets
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Nouveau projet</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <Field
          id="name"
          label="Nom"
          value={name}
          onChange={setName}
          required
        />
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-zinc-700">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-zinc-700">
            Statut
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="chef" className="mb-1 block text-sm font-medium text-zinc-700">
            Chef de projet (optionnel)
          </label>
          <select
            id="chef"
            value={chefUserId}
            onChange={(e) => setChefUserId(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          >
            <option value="">— À désigner plus tard —</option>
            {users.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.firstName} {u.lastName} ({u.email})
              </option>
            ))}
          </select>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Création…" : "Créer le projet"}
        </button>
      </form>
    </div>
  );
}
