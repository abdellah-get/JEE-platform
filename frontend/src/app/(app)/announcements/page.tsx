"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import type { Announcement } from "@/lib/types";

export default function AnnouncementsPage() {
  const { accessToken, user, loading } = useAuth();
  const [items, setItems] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setBusy(true);
    api
      .listAnnouncements(accessToken)
      .then(setItems)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Chargement impossible"),
      )
      .finally(() => setBusy(false));
  }, [accessToken]);

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  const canWrite = canAccessAdmin(user.clubRole);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">Communication</p>
          <h1 className="page-title mt-1">Annonces</h1>
          <p className="page-subtitle">
            Les annonces urgentes (épinglées) apparaissent en tête.
          </p>
        </div>
        {canWrite && (
          <Link
            href="/announcements/new"
            className="btn btn-primary"
          >
            Nouvelle
          </Link>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {busy ? (
        <LoadingBlock label="Chargement des annonces…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune annonce"
          description="Le bureau publiera bientôt les infos du club."
          action={
            canWrite ? (
              <Link
                href="/announcements/new"
                className="btn btn-primary"
              >
                Publier
              </Link>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a.id}>
              <Link
                href={`/announcements/${a.id}`}
                className={`surface-interactive block p-4 ${
                  a.pinned ? "border-warning/40 bg-warning-soft" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-ink">{a.title}</p>
                  {a.pinned && (
                    <span className="shrink-0 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning">
                      Urgent
                    </span>
                  )}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted">{a.body}</p>
                <p className="mt-2 text-xs text-muted">
                  {a.authorName} · {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
