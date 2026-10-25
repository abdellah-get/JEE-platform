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
import { formatEventWhen } from "@/lib/date-input";
import type { ClubEvent, PageResponse } from "@/lib/types";

export default function EventsPage() {
  const { accessToken, user, loading } = useAuth();
  const [pageData, setPageData] = useState<PageResponse<ClubEvent> | null>(null);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setBusy(true);
    api
      .listEvents(accessToken, page)
      .then(setPageData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Chargement impossible"),
      )
      .finally(() => setBusy(false));
  }, [accessToken, page]);

  const items = pageData?.content ?? [];

  const filtered = useMemo(
    () =>
      items.filter((e) =>
        matchesSearch(query, e.title, e.description, e.location, e.createdByName),
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
        title="Événements"
        description="AG, formations et rendez-vous du club — aussi visibles dans le calendrier."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/calendar" className="btn btn-secondary">
              Calendrier
            </Link>
            {canWrite ? (
              <Link href="/events/new" className="btn btn-primary">
                Créer
              </Link>
            ) : null}
          </div>
        }
      />

      {error && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {busy ? (
        <LoadingBlock label="Chargement des événements…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun événement"
          description="Le bureau publiera bientôt les prochaines dates du club."
          action={
            canWrite ? (
              <Link href="/events/new" className="btn btn-primary">
                Créer
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <SearchInput
            id="events-search"
            label="Rechercher un événement"
            value={query}
            onChange={setQuery}
            placeholder="Titre, lieu, description…"
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun résultat"
              description="Aucun événement ne correspond à ta recherche."
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
              {filtered.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/events/${e.id}`}
                    className={`surface-interactive block p-4 ${
                      e.pinned ? "border-warning/40 bg-warning-soft" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-[family-name:var(--font-syne)] font-semibold tracking-tight text-ink">
                        {e.title}
                      </p>
                      {e.pinned && (
                        <span className="shrink-0 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-semibold text-warning">
                          À retenir
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-ink">
                      {formatEventWhen(e.startsAt, e.endsAt)}
                    </p>
                    {e.location ? (
                      <p className="mt-0.5 text-sm text-muted">{e.location}</p>
                    ) : null}
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {e.description}
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
