"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
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
      .then((data) => {
        setItems(data);
        setSelectedDay(null);
      })
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
    return <LoadingBlock />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Club"
        title="Calendrier"
        description="Événements du club et échéances des tâches de tes projets."
        actions={
          <Link href="/events" className="btn btn-secondary">
            Événements
          </Link>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCursor((c) => addMonths(c, -1))}
        >
          Mois précédent
        </button>
        <p className="font-[family-name:var(--font-syne)] text-lg font-semibold capitalize tracking-tight">
          {monthLabel}
        </p>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setCursor((c) => addMonths(c, 1))}
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
        <LoadingBlock label="Chargement du calendrier…" />
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="grid grid-cols-7 border-b border-line bg-surface/60 text-center text-xs font-semibold uppercase tracking-wide text-muted">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div key={d} className="px-1 py-2">
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
                    className={`min-h-20 border-b border-r border-line/60 p-1.5 text-left transition-colors hover:bg-brand-soft/40 ${
                      isSelected ? "bg-brand-soft/60" : ""
                    }`}
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday ? "bg-brand text-white" : "text-ink"
                      }`}
                    >
                      {day}
                    </span>
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
            <section className="space-y-3">
              <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight">
                {new Date(selectedDay + "T12:00:00").toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </h2>
              {selectedItems.length === 0 ? (
                <EmptyState
                  title="Rien ce jour-là"
                  description="Pas d’événement ni d’échéance visible."
                  compact
                />
              ) : (
                <ul className="space-y-2">
                  {selectedItems.map((item) => (
                    <li key={`${item.type}-${item.id}`}>
                      <Link
                        href={item.link}
                        className="surface-interactive flex items-start justify-between gap-3 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-ink">{item.title}</p>
                          <p className="mt-0.5 text-xs text-muted">
                            {item.type === "EVENT" ? "Événement" : "Échéance"}
                            {item.meta ? ` · ${item.meta}` : ""}
                            {item.location ? ` · ${item.location}` : ""}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {new Date(item.startsAt).toLocaleTimeString("fr-FR", {
                              timeStyle: "short",
                            })}
                          </p>
                        </div>
                        {item.pinned ? (
                          <span className="shrink-0 rounded-full bg-warning/20 px-2 py-0.5 text-[10px] font-semibold text-warning">
                            Épinglé
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : items.length === 0 ? (
            <EmptyState
              title="Mois vide"
              description="Aucun événement ni échéance sur cette période."
            />
          ) : (
            <p className="text-sm text-muted">
              Sélectionne un jour pour voir le détail.
            </p>
          )}
        </>
      )}
    </div>
  );
}
