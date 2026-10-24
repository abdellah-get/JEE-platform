"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import type { Announcement } from "@/lib/types";

export default function AnnouncementDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken, user, loading } = useAuth();
  const [item, setItem] = useState<Announcement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!accessToken || !params.id) return;
    api
      .getAnnouncement(accessToken, params.id)
      .then(setItem)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Chargement impossible"),
      );
  }, [accessToken, params.id]);

  if (loading || !user || !accessToken) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  if (error && !item) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Link href="/announcements" className="text-sm text-zinc-500">
          ← Annonces
        </Link>
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!item) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  const canWrite = canAccessAdmin(user.clubRole);

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
      <Link href="/announcements" className="text-sm text-zinc-500 hover:text-zinc-800">
        ← Annonces
      </Link>

      <article
        className={`rounded-xl border p-6 ${
          item.pinned ? "border-amber-300 bg-amber-50" : "border-zinc-200 bg-white"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{item.title}</h1>
          {item.pinned && (
            <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-medium text-amber-900">
              Urgent
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          {item.authorName} · {new Date(item.createdAt).toLocaleString("fr-FR")}
        </p>
        <p className="mt-4 whitespace-pre-wrap text-sm text-zinc-800">{item.body}</p>
      </article>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {canWrite && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={togglePin}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            {item.pinned ? "Retirer l’épingle" : "Épingler urgent"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Supprimer
          </button>
        </div>
      )}
    </div>
  );
}
