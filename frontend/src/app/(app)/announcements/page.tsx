"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SearchInput, matchesSearch } from "@/components/ui/SearchInput";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import type { Announcement, PageResponse } from "@/lib/types";

export default function AnnouncementsPage() {
  const { accessToken, user, loading } = useAuth();
  const [pageData, setPageData] = useState<PageResponse<Announcement> | null>(null);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setBusy(true);
    api
      .listAnnouncements(accessToken, page)
      .then(setPageData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Chargement impossible"),
      )
      .finally(() => setBusy(false));
  }, [accessToken, page]);

  const items = pageData?.content ?? [];

  const filtered = useMemo(
    () =>
      items.filter((a) =>
        matchesSearch(query, a.title, a.body, a.authorName),
      ),
    [items, query],
  );

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  const canWrite = canAccessAdmin(user.clubRole);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Club"
        title="Annonces"
        description="Infos du bureau — les urgentes restent en tête de liste."
        actions={
          canWrite ? (
            <Link href="/announcements/new" className="btn btn-primary">
              Publier
            </Link>
          ) : undefined
        }
      />

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
              <Link href="/announcements/new" className="btn btn-primary">
                Publier
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <SearchInput
            id="announcements-search"
            label="Rechercher une annonce"
            value={query}
            onChange={setQuery}
            placeholder="Titre, contenu, auteur…"
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun résultat"
              description="Aucune annonce ne correspond à ta recherche."
              compact
              action={
                <button
                  type="button"
                  className="text-sm font-medium underline"
                  onClick={() => setQuery("")}
                >
                  Effacer la recherche
                </button>
              }
            />
          ) : (
            <ul className="stagger-list space-y-3">
              {filtered.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/announcements/${a.id}`}
                    className={`surface-interactive block p-4 ${
                      a.pinned ? "border-warning/40 bg-warning-soft" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-[family-name:var(--font-syne)] font-semibold tracking-tight text-ink">
                        {a.title}
                      </p>
                      {a.pinned && (
                        <span className="shrink-0 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning">
                          Urgent
                        </span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{a.body}</p>
                    <p className="mt-2 text-xs text-muted">
                      {a.authorName} ·{" "}
                      {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <PaginationBar
            page={pageData?.page ?? page}
            totalPages={pageData?.totalPages ?? 0}
            totalElements={pageData?.totalElements ?? 0}
            onPageChange={(p) => {
              setPage(p);
              setQuery("");
            }}
          />
        </>
      )}
    </div>
  );
}
