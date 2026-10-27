"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { formatEventWhen } from "@/lib/date-input";
import type { CalendarItem } from "@/lib/types";

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
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
          <span className="chip shrink-0" data-tone={kind === "event" ? "actif" : "moyenne"}>
            {kind === "event" ? "Événement" : "Échéance"}
          </span>
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

function MonthAgenda({ items }: { items: CalendarItem[] }) {
  const events = items.filter((item) => item.type === "EVENT").length;
  const tasks = items.length - events;
  const sorted = [...items].sort(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );

  return (
    <section className="space-y-3">
      <p className="text-sm text-muted">
        {`${events} événement${events > 1 ? "s" : ""} · ${tasks} échéance${tasks > 1 ? "s" : ""}`}
      </p>
      <ul className="stagger-list space-y-3">
        {sorted.map((item) => (
          <AgendaCard key={`${item.type}-${item.id}`} item={item} />
        ))}
      </ul>
    </section>
  );
}

function DayPanel({
  day,
  items,
  onBack,
}: {
  day: string;
  items: CalendarItem[];
  onBack: () => void;
}) {
  return (
    <section className="space-y-3 reveal-up">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="section-heading capitalize">{dayLabel(day)}</h2>
          <p className="section-hint">Détail du jour sélectionné.</p>
        </div>
        <button type="button" className="text-xs font-semibold text-brand" onClick={onBack}>
          Tout le mois
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState
          title="Rien ce jour-là"
          description="Pas d’événement ni d’échéance visible — choisis un autre jour ou ouvre la liste des événements."
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
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [items, setItems] = useState<CalendarItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const from = isoDate(cursor);
  const to = isoDate(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0));

  useEffect(() => {
    if (!accessToken) return;
    setBusy(true);
    setError(null);
    api
      .getCalendar(accessToken, from, to)
      .then(setItems)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return;
        setError(err instanceof ApiError ? err.message : "Chargement impossible");
      })
      .finally(() => setBusy(false));
  }, [accessToken, from, to]);

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

  const monthLabel = cursor.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday=0
  const totalDays = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedItems = selectedDay ? (byDay.get(selectedDay) ?? []) : [];
  const todayIso = isoDate(new Date());

  if (loading || !user || !accessToken) {
    return <LoadingBlock label="Ouverture du calendrier…" rows={4} />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Planning"
        title="Calendrier"
        description="Clique un jour pour voir les événements du club et les échéances de tes tâches."
        actions={
          <Link href="/events" className="btn btn-secondary">
            Liste des événements
          </Link>
        }
      />

      <div className="panel flex flex-wrap items-center justify-between gap-3 reveal-up">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setSelectedDay(null);
            setCursor((c) => addMonths(c, -1));
          }}
        >
          Mois précédent
        </button>
        <div className="text-center">
          <p className="font-[family-name:var(--font-syne)] text-lg font-semibold capitalize tracking-tight">
            {monthLabel}
          </p>
          <button
            type="button"
            className="mt-1 text-xs font-semibold text-brand"
            onClick={() => {
              setCursor(startOfMonth(new Date()));
              setSelectedDay(isoDate(new Date()));
            }}
          >
            Aujourd’hui
          </button>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            setSelectedDay(null);
            setCursor((c) => addMonths(c, 1));
          }}
        >
          Mois suivant
        </button>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {busy ? (
        <LoadingBlock label="Chargement du calendrier…" rows={5} />
      ) : (
        <>
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
                      className="min-h-20 border-b border-r border-line/60 bg-surface/30"
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
                    className="cal-day min-h-20 border-b border-r border-line/60 p-1.5 text-left hover:bg-brand-soft/40"
                  >
                    <span className="cal-day__num">{day}</span>
                    <ul className="mt-1 space-y-0.5">
                      {dayItems.slice(0, 3).map((item) => (
                        <li
                          key={`${item.type}-${item.id}`}
                          className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                            item.type === "EVENT"
                              ? "bg-brand/15 text-brand"
                              : "bg-warning/15 text-warning"
                          }`}
                        >
                          {item.title}
                        </li>
                      ))}
                      {dayItems.length > 3 ? (
                        <li className="px-1 text-[10px] text-muted">
                          +{dayItems.length - 3}
                        </li>
                      ) : null}
                    </ul>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-brand/40" /> Événement
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-warning/40" /> Échéance tâche
            </span>
          </div>

          {selectedDay ? (
            <DayPanel
              day={selectedDay}
              items={selectedItems}
              onBack={() => setSelectedDay(null)}
            />
          ) : items.length === 0 ? (
            <EmptyState
              title="Mois vide"
              description="Aucun événement ni échéance sur cette période."
            />
          ) : (
            <MonthAgenda items={items} />
          )}
        </>
      )}
    </div>
  );
}
