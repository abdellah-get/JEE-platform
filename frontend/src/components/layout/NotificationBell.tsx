"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AppNotification } from "@/lib/types";

export function NotificationBell() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const { data: countData } = useQuery({
    queryKey: queryKeys.unreadNotificationCount,
    queryFn: () => api.getUnreadNotificationCount(accessToken!),
    enabled: Boolean(accessToken),
    refetchInterval: 60_000,
  });
  const count = countData?.count ?? 0;

  const { data: items = [], isFetching } = useQuery({
    queryKey: queryKeys.notifications(false, 0),
    queryFn: () => api.listNotifications(accessToken!, false, 0, 8),
    enabled: Boolean(accessToken) && open,
    select: (data) => data.content,
  });

  const invalidateNotifications = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ]);

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(accessToken!, id),
    onSuccess: () => invalidateNotifications(),
  });

  const markAll = useMutation({
    mutationFn: () => api.markAllNotificationsRead(accessToken!),
    onSuccess: () => invalidateNotifications(),
  });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function onOpenItem(n: AppNotification) {
    if (!n.read) {
      try {
        await markRead.mutateAsync(n.id);
      } catch {
        /* ignore */
      }
    }
    setOpen(false);
  }

  if (!accessToken) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={panelId}
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
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] surface-quiet shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-line px-3 py-2">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            {count > 0 && (
              <button
                type="button"
                onClick={() => void markAll.mutateAsync()}
                className="text-xs text-muted hover:underline"
              >
                Tout lu
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {isFetching && items.length === 0 ? (
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
