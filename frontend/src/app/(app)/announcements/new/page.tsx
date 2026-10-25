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

export default function NewAnnouncementPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
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
        <p className="text-sm text-muted">Seul le bureau peut publier.</p>
        <Link href="/announcements" className="text-sm underline">
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
      const created = await api.createAnnouncement(accessToken!, {
        title: title.trim(),
        body: body.trim(),
        pinned,
      });
      toast.success("Annonce publiée.");
      router.push(`/announcements/${created.id}`);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Publication impossible";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link href="/announcements" className="text-sm text-muted hover:text-ink">
          ← Annonces
        </Link>
        <h1 className="mt-2 page-title">Nouvelle annonce</h1>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 surface-quiet p-5">
        <Field id="title" label="Titre" value={title} onChange={setTitle} required />
        <div>
          <label htmlFor="body" className="mb-1 block text-sm font-medium text-ink/80">
            Contenu
          </label>
          <textarea
            id="body"
            required
            rows={6}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm outline-none focus:border-line0"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
          />
          Épingler comme urgent
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? "Publication…" : "Publier"}
        </button>
      </form>
    </div>
  );
}
