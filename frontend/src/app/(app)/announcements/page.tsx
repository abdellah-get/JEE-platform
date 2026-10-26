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
    setError(null);
    api
      .listAnnouncements(accessToken, page)
      .then(setPageData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return;
        setError(err instanceof ApiError ? err.message : "Chargement impossible");
      })
      .finally(() => setBusy(false));
  }, [accessToken, page]);

  const items = pageData?.content ?? [];

  const filtered = useMemo(() => {
    const matched = items.filter((a) =>
      matchesSearch(query, a.title, a.body, a.authorName),
    );
    return [...matched].sort((a, b) => Number(b.pinned) - Number(a.pinned));
  }, [items, query]);
  const urgentCount = filtered.filter((a) => a.pinned).length;
  const shownCount = query ? filtered.length : (pageData?.totalElements ?? filtered.length);

  if (loading || !user || !accessToken) {
    return <LoadingBlock label="Chargement des annonces…" rows={4} />;
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
            <>
              <p className="text-sm text-muted">
                {`${shownCount} annonce${shownCount > 1 ? "s" : ""}${
                  urgentCount > 0
                    ? ` · ${urgentCount} urgente${urgentCount > 1 ? "s" : ""}`
                    : ""
                }`}
              </p>
              <ul className="stagger-list space-y-3">
                {filtered.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/announcements/${a.id}`}
                      data-pinned={a.pinned ? "true" : "false"}
                      className="announcement-card surface-interactive block p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-ink">
                          {a.title}
                        </p>
                        {a.pinned ? (
                          <span className="chip shrink-0" data-tone="urgente">
                            Urgent
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted">
                        {a.body}
                      </p>
                      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
                        <span className="min-w-0 truncate">
                          {a.authorName}
                          {" · "}
                          {new Date(a.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="shrink-0 font-semibold text-brand">Lire</span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
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
