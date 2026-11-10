"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Field } from "@/components/auth/Field";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
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
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("BROUILLON");
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<"archive" | "hard" | null>(null);
  const [deleting, setDeleting] = useState(false);

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
    return <LoadingBlock />;
  }

  if (error && !project) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <Link href="/projects" className="text-sm text-muted hover:text-ink">
          ← Projets
        </Link>
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      </div>
    );
  }

  if (!project) {
    return <LoadingBlock />;
  }

  if (!canManageProject(user.clubRole, project.myRole)) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-muted hover:text-ink"
        >
          ← {project.name}
        </Link>
        <h1 className="page-title">Accès refusé</h1>
        <p className="text-sm text-muted">
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
          className="text-sm text-muted hover:text-ink"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-2 page-title">Paramètres</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 surface-quiet p-5">
        <Field
          id="name"
          label="Nom"
          value={name}
          onChange={setName}
          required
        />
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink/80">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium text-ink/80">
            Statut
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
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
          className="btn btn-primary"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>

      {canAccessAdmin(user.clubRole) ? (
        <section className="space-y-3 rounded-lg border border-danger/30 bg-danger/5 p-5">
          <h2 className="text-sm font-semibold text-ink">Zone bureau</h2>
          <p className="text-sm text-muted">
            Archiver masque le projet (statut ARCHIVE). Supprimer efface le
            projet et cascade tâches / membres / PJ via la base.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirm("archive")}
            >
              Archiver
            </button>
            <button
              type="button"
              className="btn btn-secondary text-danger"
              onClick={() => setConfirm("hard")}
            >
              Supprimer définitivement
            </button>
          </div>
        </section>
      ) : null}

      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm === "hard"
            ? "Supprimer définitivement ?"
            : "Archiver ce projet ?"
        }
        description={
          confirm === "hard"
            ? "Irréversible : tâches, membres et pièces jointes liés seront retirés."
            : "Le projet passera en ARCHIVE. Tu pourras le rouvrir plus tard via le statut."
        }
        confirmLabel={confirm === "hard" ? "Supprimer" : "Archiver"}
        danger={confirm === "hard"}
        busy={deleting}
        onCancel={() => !deleting && setConfirm(null)}
        onConfirm={() => {
          void (async () => {
            setDeleting(true);
            try {
              const hard = confirm === "hard";
              await api.deleteProject(accessToken!, projectId, hard);
              toast.success(hard ? "Projet supprimé." : "Projet archivé.");
              router.replace("/projects");
            } catch (err) {
              toast.error(
                err instanceof ApiError ? err.message : "Action impossible",
              );
              setDeleting(false);
              setConfirm(null);
            }
          })();
        }}
      />
    </div>
  );
}
