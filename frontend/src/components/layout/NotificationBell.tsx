"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import type { AppNotification } from "@/lib/types";

export function NotificationBell() {
  const { accessToken } = useAuth();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(() => {
    if (!accessToken) return;
    api
      .getUnreadNotificationCount(accessToken)
      .then((r) => setCount(r.count))
      .catch(() => setCount(0));
  }, [accessToken]);

  useEffect(() => {
    refreshCount();
    const id = window.setInterval(refreshCount, 60_000);
    return () => window.clearInterval(id);
  }, [refreshCount]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
    }
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  async function toggle() {
    if (!accessToken) return;
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const data = await api.listNotifications(accessToken, false);
        setItems(data.slice(0, 8));
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
  }

  async function onOpenItem(n: AppNotification) {
    if (!accessToken) return;
    if (!n.read) {
      try {
        await api.markNotificationRead(accessToken, n.id);
        setCount((c) => Math.max(0, c - 1));
        setItems((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
        );
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }

  async function onMarkAll() {
    if (!accessToken) return;
    try {
      await api.markAllNotificationsRead(accessToken);
      setCount(0);
      setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    } catch {
      /* ignore */
    }
  }

  if (!accessToken) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => void toggle()}
        aria-label={count > 0 ? `${count} notifications non lues` : "Notifications"}
        className="btn btn-secondary relative px-2.5 py-1.5"
      >
        Notifs
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] surface-quiet shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {count > 0 && (
              <button
                type="button"
                onClick={() => void onMarkAll()}
                className="text-xs text-muted hover:underline"
              >
                Tout lu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-4 text-sm text-muted">Chargement…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted">Aucune notification.</p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id} className="border-b border-line last:border-0">
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => void onOpenItem(n)}
                        className={`block px-3 py-2.5 hover:bg-paper ${
                          n.read ? "" : "bg-warning-soft/60"
                        }`}
                      >
                        <p className="text-sm font-medium text-ink">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>
                        )}
                        <p className="mt-1 text-[11px] text-muted/80">
                          {new Date(n.createdAt).toLocaleString("fr-FR")}
                        </p>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void onOpenItem(n)}
                        className={`block w-full px-3 py-2.5 text-left hover:bg-paper ${
                          n.read ? "" : "bg-warning-soft/60"
                        }`}
                      >
                        <p className="text-sm font-medium text-ink">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted">{n.body}</p>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-line px-3 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-ink/80 underline"
            >
              Voir tout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
