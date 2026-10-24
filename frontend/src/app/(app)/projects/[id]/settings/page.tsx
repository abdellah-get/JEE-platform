"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Field } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import {
  PROJECT_STATUSES,
  canManageProject,
  statusLabel,
} from "@/lib/projects";
import type { Project, ProjectStatus } from "@/lib/types";

export default function ProjectSettingsPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const router = useRouter();
  const { accessToken, user, loading } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("BROUILLON");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!accessToken || !projectId) return;
    api
      .getProject(accessToken, projectId)
      .then((p) => {
        setProject(p);
        setName(p.name);
        setDescription(p.description ?? "");
        setStatus(p.status);
      })
      .catch((err) => {
        setError(
          err instanceof ApiError
            ? err.status === 404
              ? "Projet introuvable ou accès refusé."
              : err.message
            : "Chargement impossible",
        );
      });
  }, [accessToken, projectId]);

  if (loading || !user || !accessToken) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  if (error && !project) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <Link href="/projects" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← Projets
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      </div>
    );
  }

  if (!project) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  if (!canManageProject(user.clubRole, project.myRole)) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← {project.name}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Accès refusé</h1>
        <p className="text-sm text-zinc-600">
          Seul le chef de projet ou le bureau peut modifier les paramètres.
        </p>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMsg(null);
    setSaving(true);
    try {
      const updated = await api.updateProject(accessToken!, projectId, {
        name: name.trim(),
        description: description.trim(),
        status,
      });
      setProject(updated);
      setMsg("Paramètres enregistrés.");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-zinc-500 hover:text-zinc-800"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Paramètres</h1>
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

        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </div>
  );
}
