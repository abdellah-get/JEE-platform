"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatEventWhen } from "@/lib/date-input";
import { queryKeys } from "@/lib/query-keys";
import type { CalendarItem, EventRsvpStatus } from "@/lib/types";

type ViewMode = "month" | "week" | "agenda";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfWeek(d: Date) {
  const result = new Date(d);
  result.setHours(12, 0, 0, 0);
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  return result;
}

function addDays(d: Date, n: number) {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function isoDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function dayLabel(iso: string) {
  return new Date(iso + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function rsvpLabel(status: EventRsvpStatus | null | undefined) {
  switch (status) {
    case "GOING":
      return "Présent";
    case "MAYBE":
      return "Peut-être";
    case "DECLINED":
      return "Absent";
    default:
      return null;
  }
}

function itemWhen(item: CalendarItem) {
  if (item.type === "TASK_DUE") {
    return new Date(item.startsAt).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
  return formatEventWhen(item.startsAt, item.endsAt);
}

function AgendaCard({ item }: { item: CalendarItem }) {
  const kind = item.type === "EVENT" ? "event" : "task";
  const rsvp = rsvpLabel(item.myRsvp);
  return (
    <li>
      <Link
        href={item.link}
        data-kind={kind}
        className="announcement-card surface-interactive block p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-ink">
            {item.title}
          </p>
          <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
            {rsvp ? (
              <span className="chip" data-tone="actif">
                {rsvp}
              </span>
            ) : null}
            <span className="chip" data-tone={kind === "event" ? "actif" : "moyenne"}>
              {kind === "event" ? "Événement" : "Échéance"}
            </span>
          </div>
        </div>
        <p className="mt-1 text-sm text-ink">{itemWhen(item)}</p>
        {item.location || item.meta ? (
          <p className="mt-0.5 text-sm text-muted">
            {[item.meta, item.location].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <div className="mt-3 flex justify-end text-xs">
          <span className="font-semibold text-brand">Ouvrir</span>
        </div>
      </Link>
    </li>
  );
}

function DayPanel({
  day,
  items,
  onBack,
  backLabel,
}: {
  day: string;
  items: CalendarItem[];
  onBack: () => void;
  backLabel: string;
}) {
  return (
    <section className="space-y-3 reveal-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-heading capitalize">{dayLabel(day)}</h2>
          <p className="section-hint">Détail du jour sélectionné.</p>
        </div>
        <button type="button" className="text-xs font-semibold text-brand" onClick={onBack}>
          {backLabel}
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="Rien ce jour-là"
          description="Pas d’événement ni d’échéance visible — choisis un autre jour."
          compact
        />
      ) : (
        <ul className="stagger-list space-y-3">
          {items.map((item) => (
            <AgendaCard key={`${item.type}-${item.id}`} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function CalendarPage() {
  const { accessToken, user, loading } = useAuth();
  const [view, setView] = useState<ViewMode>("month");
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [weekAnchor, setWeekAnchor] = useState(() => startOfWeek(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const range = useMemo(() => {
    if (view === "week") {
      const from = weekAnchor;
      const to = addDays(weekAnchor, 6);
      return { from: isoDate(from), to: isoDate(to) };
    }
    if (view === "agenda") {
      const from = weekAnchor;
      const to = addDays(from, 41);
      return { from: isoDate(from), to: isoDate(to) };
    }
    const from = cursor;
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
    return { from: isoDate(from), to: isoDate(to) };
  }, [view, cursor, weekAnchor]);

  const { data: items = [], error, isPending: busy } = useQuery({
    queryKey: queryKeys.calendar(range.from, range.to),
    queryFn: () => api.getCalendar(accessToken!, range.from, range.to),
    enabled: Boolean(accessToken),
  });
  const errorMessage =
    error instanceof ApiError ? error.message : error ? "Chargement impossible" : null;

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = isoDate(new Date(item.startsAt));
      const list = map.get(key) ?? [];
      list.push(item);
      map.set(key, list);
    }
    return map;
  }, [items]);

  const sortedAgenda = useMemo(
    () =>
      [...items].sort(
        (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    [items],
  );

  const todayIso = isoDate(new Date());
  const selectedItems = selectedDay ? (byDay.get(selectedDay) ?? []) : [];

  const monthLabel = cursor.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
  const weekLabel = `${weekAnchor.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })} – ${addDays(weekAnchor, 6).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const totalDays = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekAnchor, i));

  function goToday() {
    const now = new Date();
    setCursor(startOfMonth(now));
    setWeekAnchor(startOfWeek(now));
    setSelectedDay(isoDate(now));
  }

  function goPrev() {
    setSelectedDay(null);
    if (view === "week") {
      setWeekAnchor((w) => addDays(w, -7));
    } else if (view === "month") {
      setCursor((c) => addMonths(c, -1));
    } else {
      setWeekAnchor((w) => addDays(w, -7));
    }
  }

  function goNext() {
    setSelectedDay(null);
    if (view === "week") {
      setWeekAnchor((w) => addDays(w, 7));
    } else if (view === "month") {
      setCursor((c) => addMonths(c, 1));
    } else {
      setWeekAnchor((w) => addDays(w, 7));
    }
  }

  if (loading || !user || !accessToken) {
    return <LoadingBlock label="Ouverture du calendrier…" rows={4} />;
  }

  const agendaEnd = addDays(weekAnchor, 41);
  const agendaLabel = `${weekAnchor.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  })} – ${agendaEnd.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
  const navLabel =
    view === "week" ? weekLabel : view === "agenda" ? agendaLabel : monthLabel;
  const prevLabel =
    view === "month" ? "Mois précédent" : view === "week" ? "Semaine précédente" : "Période précédente";
  const nextLabel =
    view === "month" ? "Mois suivant" : view === "week" ? "Semaine suivante" : "Période suivante";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Calendrier"
        description="Mois, semaine ou agenda — événements du club et échéances de tâches."
        actions={
          <Link href="/events" className="btn btn-secondary">
            Liste des événements
          </Link>
        }
      />

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Vue du calendrier"
      >
        {(
          [
            ["month", "Mois"],
            ["week", "Semaine"],
            ["agenda", "Agenda"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={`btn ${view === id ? "btn-primary" : "btn-secondary"}`}
            onClick={() => {
              setView(id);
              setSelectedDay(null);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="panel flex flex-wrap items-center justify-between gap-3 reveal-up">
        <button type="button" className="btn btn-secondary" onClick={goPrev}>
          {prevLabel}
        </button>
        <div className="text-center">
          <p className="font-[family-name:var(--font-syne)] text-lg font-semibold capitalize tracking-tight">
            {navLabel}
          </p>
          <button
            type="button"
            className="mt-1 text-xs font-semibold text-brand"
            onClick={goToday}
          >
            Aujourd’hui
          </button>
        </div>
        <button type="button" className="btn btn-secondary" onClick={goNext}>
          {nextLabel}
        </button>
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {busy ? (
        <LoadingBlock label="Chargement du calendrier…" rows={5} />
      ) : (
        <>
          {view === "month" ? (
            <div className="overflow-hidden rounded-xl border border-line bg-surface reveal-up shadow-[var(--shadow-soft)]">
              <div className="grid grid-cols-7 border-b border-line bg-brand-mist/80 text-center text-xs font-semibold tracking-wide text-muted">
                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                  <div key={d} className="px-1 py-2.5">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {cells.map((day, idx) => {
                  if (day == null) {
                    return (
                      <div
                        key={`e-${idx}`}
                        className="min-h-16 border-b border-r border-line/60 bg-surface/30 sm:min-h-20"
                      />
                    );
                  }
                  const key = isoDate(new Date(year, month, day));
                  const dayItems = byDay.get(key) ?? [];
                  const isToday = key === todayIso;
                  const isSelected = key === selectedDay;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(key)}
                      data-today={isToday ? "true" : "false"}
                      data-selected={isSelected ? "true" : "false"}
                      className="cal-day min-h-16 border-b border-r border-line/60 p-1 text-left hover:bg-brand-soft/40 sm:min-h-20 sm:p-1.5"
                    >
                      <span className="cal-day__num">{day}</span>
                      <ul className="mt-1 hidden space-y-0.5 sm:block">
                        {dayItems.slice(0, 3).map((item) => (
                          <li
                            key={`${item.type}-${item.id}`}
                            className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                              item.type === "EVENT"
                                ? "bg-brand/15 text-brand"
                                : "bg-warning/15 text-warning"
                            }`}
                          >
                            {item.myRsvp === "GOING" ? "✓ " : ""}
                            {item.title}
                          </li>
                        ))}
                        {dayItems.length > 3 ? (
                          <li className="px-1 text-[10px] text-muted">
                            +{dayItems.length - 3}
                          </li>
                        ) : null}
                      </ul>
                      {dayItems.length > 0 ? (
                        <span className="mt-1 block text-[10px] font-semibold text-brand sm:hidden">
                          {dayItems.length}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {view === "week" ? (
            <div className="space-y-3 reveal-up">
              <div className="grid gap-2 sm:grid-cols-7">
                {weekDays.map((day) => {
                  const key = isoDate(day);
                  const dayItems = byDay.get(key) ?? [];
                  const isToday = key === todayIso;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(key)}
                      className={`rounded-xl border border-line p-3 text-left hover:bg-brand-soft/30 ${
                        isToday ? "border-brand bg-brand-soft/20" : "bg-surface"
                      }`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                        {day.toLocaleDateString("fr-FR", { weekday: "short" })}
                      </p>
                      <p className="mt-0.5 text-lg font-semibold text-ink">
                        {day.getDate()}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {dayItems.slice(0, 4).map((item) => (
                          <li
                            key={`${item.type}-${item.id}`}
                            className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${
                              item.type === "EVENT"
                                ? "bg-brand/15 text-brand"
                                : "bg-warning/15 text-warning"
                            }`}
                          >
                            {item.myRsvp === "GOING" ? "✓ " : ""}
                            {item.title}
                          </li>
                        ))}
                        {dayItems.length === 0 ? (
                          <li className="text-[11px] text-muted">—</li>
                        ) : null}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {view === "agenda" ? (
            sortedAgenda.length === 0 ? (
              <EmptyState
                title="Agenda vide"
                description="Aucun événement ni échéance sur les prochaines semaines."
              />
            ) : (
              <ul className="stagger-list space-y-3 reveal-up">
                {sortedAgenda.map((item) => (
                  <AgendaCard key={`${item.type}-${item.id}`} item={item} />
                ))}
              </ul>
            )
          ) : null}

          <div className="flex flex-wrap gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand/40" /> Événement
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-warning/40" /> Échéance tâche
            </span>
            <span className="inline-flex items-center gap-1.5">✓ RSVP Présent</span>
          </div>

          {view !== "agenda" && selectedDay ? (
            <DayPanel
              day={selectedDay}
              items={selectedItems}
              onBack={() => setSelectedDay(null)}
              backLabel={view === "week" ? "Toute la semaine" : "Tout le mois"}
            />
          ) : null}

          {view === "month" && !selectedDay && items.length === 0 ? (
            <EmptyState
              title="Mois vide"
              description="Aucun événement ni échéance sur cette période."
            />
          ) : null}
        </>
      )}
    </div>
  );
}
