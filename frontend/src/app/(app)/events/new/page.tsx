"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Field } from "@/components/auth/Field";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import { fromDatetimeLocalValue } from "@/lib/date-input";

export default function NewEventPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [pinned, setPinned] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  if (!canAccessAdmin(user.clubRole)) {
    return (
      <div className="mx-auto max-w-xl space-y-3">
        <h1 className="page-title">Accès refusé</h1>
        <p className="text-sm text-muted">Seul le bureau peut créer un événement.</p>
        <Link href="/events" className="text-sm underline">
          Retour
        </Link>
      </div>
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const created = await api.createEvent(accessToken!, {
        title: title.trim(),
        description: description.trim(),
        location: location.trim() || undefined,
        startsAt: fromDatetimeLocalValue(startsAt),
        endsAt: endsAt ? fromDatetimeLocalValue(endsAt) : null,
        pinned,
      });
      toast.success("Événement créé.");
      router.push(`/events/${created.id}`);
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
        <Link href="/events" className="text-sm text-muted hover:text-ink">
          ← Événements
        </Link>
        <h1 className="mt-2 page-title">Nouvel événement</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 surface-quiet p-5">
        <Field id="title" label="Titre" value={title} onChange={setTitle} required />
        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium text-ink/80">
            Description
          </label>
          <textarea
            id="description"
            required
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <Field
          id="location"
          label="Lieu (optionnel)"
          value={location}
          onChange={setLocation}
        />
        <div>
          <label htmlFor="startsAt" className="mb-1 block text-sm font-medium text-ink/80">
            Début
          </label>
          <input
            id="startsAt"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <div>
          <label htmlFor="endsAt" className="mb-1 block text-sm font-medium text-ink/80">
            Fin (optionnel)
          </label>
          <input
            id="endsAt"
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
          />
          Épingler (notif membres)
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={saving} className="btn btn-primary">
          {saving ? "Création…" : "Créer"}
        </button>
      </form>
    </div>
  );
}
