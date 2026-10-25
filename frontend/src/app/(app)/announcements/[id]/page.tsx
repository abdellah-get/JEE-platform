"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Field } from "@/components/auth/Field";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import type { Announcement } from "@/lib/types";

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const [item, setItem] = useState<Announcement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");

  useEffect(() => {
    if (!accessToken || !params.id) return;
    api
      .getAnnouncement(accessToken, params.id)
      .then((a) => {
        setItem(a);
        setEditTitle(a.title);
        setEditBody(a.body);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Chargement impossible"),
      );
  }, [accessToken, params.id]);

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  if (error && !item) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Link href="/announcements" className="text-sm text-muted">
          ← Annonces
        </Link>
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (!item) {
    return <LoadingBlock label="Chargement de l’annonce…" />;
  }

  const canWrite = canAccessAdmin(user.clubRole);

  function startEdit() {
    setEditTitle(item!.title);
    setEditBody(item!.body);
    setEditing(true);
    setError(null);
  }

  function cancelEdit() {
    setEditing(false);
    setEditTitle(item!.title);
    setEditBody(item!.body);
    setError(null);
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateAnnouncement(accessToken!, item!.id, {
        title: editTitle.trim(),
        body: editBody.trim(),
      });
      setItem(updated);
      setEditing(false);
      toast.success("Annonce mise à jour.");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Enregistrement impossible";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function togglePin() {
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateAnnouncement(accessToken!, item!.id, {
        pinned: !item!.pinned,
      });
      setItem(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mise à jour impossible");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm("Supprimer cette annonce ?")) return;
    setBusy(true);
    try {
      await api.deleteAnnouncement(accessToken!, item!.id);
      router.push("/announcements");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression impossible");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/announcements" className="text-sm text-muted hover:text-ink">
        ← Annonces
      </Link>

      {editing && canWrite ? (
        <form
          onSubmit={onSaveEdit}
          className="space-y-4 surface-quiet p-6"
        >
          <h1 className="text-lg font-semibold tracking-tight">Modifier l’annonce</h1>
          <Field
            id="edit-title"
            label="Titre"
            value={editTitle}
            onChange={setEditTitle}
            required
          />
          <div>
            <label htmlFor="edit-body" className="mb-1 block text-sm font-medium text-ink/80">
              Contenu
            </label>
            <textarea
              id="edit-body"
              required
              rows={8}
              maxLength={10000}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-line0"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy || !editTitle.trim() || !editBody.trim()}
              className="btn btn-primary"
            >
              {busy ? "Enregistrement…" : "Enregistrer"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={cancelEdit}
              className="btn btn-secondary"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <article
          className={`rounded-xl border p-6 ${
            item.pinned ? "border-warning/40 bg-warning-soft" : "border-line bg-white"
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="page-title">{item.title}</h1>
            {item.pinned && (
              <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-900">
                Urgent
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted">
            {item.authorName} · {new Date(item.createdAt).toLocaleString("fr-FR")}
            {item.updatedAt !== item.createdAt
              ? ` · modifié ${new Date(item.updatedAt).toLocaleString("fr-FR")}`
              : ""}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm text-ink">{item.body}</p>
        </article>
      )}

      {error && !editing && <p className="text-sm text-red-600">{error}</p>}

      {canWrite && !editing && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={startEdit}
            className="btn btn-secondary"
          >
            Modifier
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={togglePin}
            className="btn btn-secondary"
          >
            {item.pinned ? "Retirer l’épingle" : "Épingler urgent"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
