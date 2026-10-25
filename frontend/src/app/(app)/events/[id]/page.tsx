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
  formatEventWhen,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/lib/date-input";
import type { ClubEvent } from "@/lib/types";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const [item, setItem] = useState<ClubEvent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStartsAt, setEditStartsAt] = useState("");
  const [editEndsAt, setEditEndsAt] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!accessToken || !params.id) return;
    api
      .getEvent(accessToken, params.id)
      .then((e) => {
        setItem(e);
        setEditTitle(e.title);
        setEditDescription(e.description);
        setEditLocation(e.location ?? "");
        setEditStartsAt(toDatetimeLocalValue(e.startsAt));
        setEditEndsAt(toDatetimeLocalValue(e.endsAt));
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
        <Link href="/events" className="text-sm text-muted">
          ← Événements
        </Link>
        <p className="text-sm text-danger">{error}</p>
      </div>
    );
  }

  if (!item) {
    return <LoadingBlock label="Chargement de l’événement…" />;
  }

  const canWrite = canAccessAdmin(user.clubRole);

  function startEdit() {
    setEditTitle(item!.title);
    setEditDescription(item!.description);
    setEditLocation(item!.location ?? "");
    setEditStartsAt(toDatetimeLocalValue(item!.startsAt));
    setEditEndsAt(toDatetimeLocalValue(item!.endsAt));
    setEditing(true);
    setError(null);
  }

  function cancelEdit() {
    setEditing(false);
    setError(null);
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const updated = await api.updateEvent(accessToken!, item!.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        location: editLocation.trim(),
        startsAt: fromDatetimeLocalValue(editStartsAt),
        endsAt: editEndsAt ? fromDatetimeLocalValue(editEndsAt) : undefined,
        clearEndsAt: !editEndsAt,
      });
      setItem(updated);
      setEditing(false);
      toast.success("Événement mis à jour.");
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
      const updated = await api.updateEvent(accessToken!, item!.id, {
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
    setBusy(true);
    try {
      await api.deleteEvent(accessToken!, item!.id);
      toast.success("Événement supprimé.");
      router.push("/events");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression impossible");
      setBusy(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/events" className="text-sm text-muted hover:text-ink">
        ← Événements
      </Link>

      {editing && canWrite ? (
        <form onSubmit={onSaveEdit} className="space-y-4 surface-quiet p-6">
          <h1 className="text-lg font-semibold tracking-tight">Modifier l’événement</h1>
          <Field
            id="edit-title"
            label="Titre"
            value={editTitle}
            onChange={setEditTitle}
            required
          />
          <div>
            <label htmlFor="edit-description" className="mb-1 block text-sm font-medium text-ink/80">
              Description
            </label>
            <textarea
              id="edit-description"
              required
              rows={6}
              maxLength={10000}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <Field
            id="edit-location"
            label="Lieu"
            value={editLocation}
            onChange={setEditLocation}
          />
          <div>
            <label htmlFor="edit-starts" className="mb-1 block text-sm font-medium text-ink/80">
              Début
            </label>
            <input
              id="edit-starts"
              type="datetime-local"
              required
              value={editStartsAt}
              onChange={(e) => setEditStartsAt(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          <div>
            <label htmlFor="edit-ends" className="mb-1 block text-sm font-medium text-ink/80">
              Fin
            </label>
            <input
              id="edit-ends"
              type="datetime-local"
              value={editEndsAt}
              onChange={(e) => setEditEndsAt(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy || !editTitle.trim() || !editDescription.trim()}
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
                À retenir
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-medium text-ink">
            {formatEventWhen(item.startsAt, item.endsAt)}
          </p>
          {item.location ? (
            <p className="mt-1 text-sm text-muted">{item.location}</p>
          ) : null}
          <p className="mt-2 text-xs text-muted">
            {item.createdByName} · {new Date(item.createdAt).toLocaleString("fr-FR")}
          </p>
          <p className="mt-4 whitespace-pre-wrap text-sm text-ink">{item.description}</p>
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
            {item.pinned ? "Retirer l’épingle" : "Épingler"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-danger hover:bg-danger/10 disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cet événement ?"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        danger
        busy={busy}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => void onDelete()}
      />
    </div>
  );
}
