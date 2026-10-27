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

function splitEvents(events: ClubEvent[]) {
  const now = Date.now();
  const upcoming: ClubEvent[] = [];
  const past: ClubEvent[] = [];
  for (const event of events) {
    if (new Date(event.startsAt).getTime() >= now) upcoming.push(event);
    else past.push(event);
  }
  const byTime = (a: ClubEvent, b: ClubEvent) =>
    new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
  const pinnedFirst = (list: ClubEvent[], direction: 1 | -1) =>
    [...list].sort((a, b) => {
      if (a.pinned !== b.pinned) return Number(b.pinned) - Number(a.pinned);
      return direction * byTime(a, b);
    });
  return {
    upcoming: pinnedFirst(upcoming, 1),
    past: pinnedFirst(past, -1),
  };
}

function EventCard({ event }: { event: ClubEvent }) {
  return (
    <li>
      <Link
        href={`/events/${event.id}`}
        data-pinned={event.pinned ? "true" : "false"}
        className="announcement-card surface-interactive block p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-ink">
            {event.title}
          </p>
          {event.pinned ? (
            <span className="chip shrink-0" data-tone="urgente">
              À retenir
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm text-ink">
          {formatEventWhen(event.startsAt, event.endsAt)}
        </p>
        {event.location ? (
          <p className="mt-0.5 text-sm text-muted">{event.location}</p>
        ) : null}
        {event.description ? (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">
            {event.description}
          </p>
        ) : null}
        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
          <span className="min-w-0 truncate">{event.createdByName}</span>
          <span className="shrink-0 font-semibold text-brand">Ouvrir</span>
        </div>
      </Link>
    </li>
  );
}

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
    setError(null);
    api
      .listEvents(accessToken, page)
      .then(setPageData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return;
        setError(err instanceof ApiError ? err.message : "Chargement impossible");
      })
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
  const { upcoming, past } = splitEvents(filtered);
  const shownCount = query ? filtered.length : (pageData?.totalElements ?? filtered.length);

  if (loading || !user || !accessToken) {
    return <LoadingBlock label="Chargement des événements…" rows={4} />;
  }

  const canWrite = canAccessAdmin(user.clubRole);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Vie du club"
        title="Événements"
        description="AG, formations et rendez-vous — ouvre le calendrier pour la vue mois."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/calendar" className="btn btn-secondary">
              Voir le calendrier
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
        <LoadingBlock label="Chargement des événements…" rows={4} />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun événement pour l’instant"
          description="Dès qu’une date est publiée par le bureau, elle apparaît ici et dans le calendrier."
          action={
            canWrite ? (
              <Link href="/events/new" className="btn btn-primary">
                Créer un événement
              </Link>
            ) : (
              <Link href="/calendar" className="btn btn-secondary">
                Voir le calendrier
              </Link>
            )
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
            <>
              <p className="text-sm text-muted">
                {`${shownCount} événement${shownCount > 1 ? "s" : ""} · ${upcoming.length} à venir`}
              </p>
              {upcoming.length > 0 ? (
                <section className="space-y-3">
                  {past.length > 0 ? (
                    <h2 className="text-sm font-semibold text-ink">À venir</h2>
                  ) : null}
                  <ul className="stagger-list space-y-3">
                    {upcoming.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </ul>
                </section>
              ) : null}
              {past.length > 0 ? (
                <section className="space-y-3">
                  <h2 className="text-sm font-semibold text-ink">Passés</h2>
                  <ul className="stagger-list space-y-3">
                    {past.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </ul>
                </section>
              ) : null}
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
