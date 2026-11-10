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
import type { ClubEvent, EventRsvp, EventRsvpStatus } from "@/lib/types";

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
  const [participants, setParticipants] = useState<EventRsvp[]>([]);

  useEffect(() => {
    if (!accessToken || !params.id) return;
    setError(null);
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
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return;
        setError(err instanceof ApiError ? err.message : "Chargement impossible");
      });
  }, [accessToken, params.id]);

  useEffect(() => {
    if (!accessToken || !params.id || !user || !canAccessAdmin(user.clubRole)) {
      setParticipants([]);
      return;
    }
    api
      .listEventRsvps(accessToken, params.id)
      .then(setParticipants)
      .catch(() => setParticipants([]));
  }, [accessToken, params.id, user]);

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

  async function setRsvp(status: EventRsvpStatus) {
    setBusy(true);
    setError(null);
    try {
      const updated = await api.upsertEventRsvp(accessToken!, item!.id, status);
      setItem(updated);
      toast.success("Réponse enregistrée.");
      if (canWrite) {
        const list = await api.listEventRsvps(accessToken!, item!.id);
        setParticipants(list);
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "RSVP impossible";
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  }

  async function clearRsvp() {
    setBusy(true);
    try {
      const updated = await api.clearEventRsvp(accessToken!, item!.id);
      setItem(updated);
      toast.success("Réponse retirée.");
      if (canWrite) {
        const list = await api.listEventRsvps(accessToken!, item!.id);
        setParticipants(list);
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Action impossible");
    } finally {
      setBusy(false);
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
              className="input-field"
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
              className="input-field"
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
              className="input-field"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
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
          className="announcement-card project-hero"
          data-pinned={item.pinned ? "true" : "false"}
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="page-title">{item.title}</h1>
            {item.pinned ? (
              <span className="chip shrink-0" data-tone="urgente">
                À retenir
              </span>
            ) : null}
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

      {error && !editing && <p className="text-sm text-danger">{error}</p>}

      {!editing && (
        <section className="surface-quiet space-y-3 p-5" aria-label="RSVP">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-ink">Ta présence</h2>
              <p className="mt-0.5 text-xs text-muted">
                {(item.goingCount ?? 0)} présent
                {(item.goingCount ?? 0) > 1 ? "s" : ""} · {(item.maybeCount ?? 0)}{" "}
                peut-être · {(item.declinedCount ?? 0)} absent
                {(item.declinedCount ?? 0) > 1 ? "s" : ""}
              </p>
            </div>
            {item.myRsvp ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void clearRsvp()}
                className="text-xs font-semibold text-muted underline"
              >
                Retirer ma réponse
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["GOING", "Présent"],
                ["MAYBE", "Peut-être"],
                ["DECLINED", "Absent"],
              ] as const
            ).map(([status, label]) => (
              <button
                key={status}
                type="button"
                disabled={busy}
                onClick={() => void setRsvp(status)}
                className={`btn ${item.myRsvp === status ? "btn-primary" : "btn-secondary"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>
      )}

      {canWrite && !editing && participants.length > 0 ? (
        <section className="surface-quiet p-5" aria-label="Participants">
          <h2 className="text-sm font-semibold text-ink">Participants</h2>
          <ul className="mt-3 divide-y divide-line">
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span>
                  <span className="font-medium text-ink">{p.userName}</span>
                  <span className="ml-2 text-xs text-muted">{p.userEmail}</span>
                </span>
                <span className="chip" data-tone="actif">
                  {p.status === "GOING"
                    ? "Présent"
                    : p.status === "MAYBE"
                      ? "Peut-être"
                      : "Absent"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
