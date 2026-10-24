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
        className="relative rounded-lg border border-zinc-300 px-2.5 py-1.5 text-sm hover:bg-zinc-50"
      >
        Notifs
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
            <p className="text-sm font-semibold text-zinc-900">Notifications</p>
            {count > 0 && (
              <button
                type="button"
                onClick={() => void onMarkAll()}
                className="text-xs text-zinc-600 hover:underline"
              >
                Tout lu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-3 py-4 text-sm text-zinc-500">Chargement…</p>
            ) : items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-zinc-500">Aucune notification.</p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id} className="border-b border-zinc-50 last:border-0">
                    {n.link ? (
                      <Link
                        href={n.link}
                        onClick={() => void onOpenItem(n)}
                        className={`block px-3 py-2.5 hover:bg-zinc-50 ${
                          n.read ? "" : "bg-amber-50/60"
                        }`}
                      >
                        <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600">{n.body}</p>
                        )}
                        <p className="mt-1 text-[11px] text-zinc-400">
                          {new Date(n.createdAt).toLocaleString("fr-FR")}
                        </p>
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => void onOpenItem(n)}
                        className={`block w-full px-3 py-2.5 text-left hover:bg-zinc-50 ${
                          n.read ? "" : "bg-amber-50/60"
                        }`}
                      >
                        <p className="text-sm font-medium text-zinc-900">{n.title}</p>
                        {n.body && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-zinc-600">{n.body}</p>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="border-t border-zinc-100 px-3 py-2">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-zinc-700 underline"
            >
              Voir tout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
