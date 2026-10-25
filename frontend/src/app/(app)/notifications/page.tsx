"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AppNotification } from "@/lib/types";

export default function NotificationsPage() {
  const { accessToken, loading } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const {
    data: items = [],
    error,
    isPending,
  } = useQuery({
    queryKey: queryKeys.notifications(false),
    queryFn: () => api.listNotifications(accessToken!),
    enabled: Boolean(accessToken),
  });

  const invalidateNotifications = () =>
    queryClient.invalidateQueries({ queryKey: ["notifications"] });

  const markAll = useMutation({
    mutationFn: () => api.markAllNotificationsRead(accessToken!),
    onSuccess: async () => {
      await invalidateNotifications();
      toast.success("Tout marqué comme lu.");
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Action impossible");
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(accessToken!, id),
    onSuccess: () => invalidateNotifications(),
  });

  if (loading || !accessToken) {
    return <LoadingBlock />;
  }

  async function openItem(n: AppNotification) {
    if (!n.read) {
      try {
        await markRead.mutateAsync(n.id);
      } catch {
        /* ignore */
      }
    }
  }

  const errorMessage =
    error instanceof ApiError ? error.message : error ? "Chargement impossible" : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="mt-1 text-sm text-muted">
            Assignations et annonces urgentes.
          </p>
        </div>
        {items.some((n) => !n.read) && (
          <button
            type="button"
            onClick={() => void markAll.mutateAsync()}
            className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-paper"
          >
            Tout marquer lu
          </button>
        )}
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {isPending ? (
        <LoadingBlock label="Chargement des notifications…" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucune notification"
          description="Tu seras prévenu lors d’une assignation ou d’une annonce épinglée."
        />
      ) : (
        <ul className="divide-y divide-line surface-quiet">
          {items.map((n) => (
            <li key={n.id}>
              {n.link ? (
                <Link
                  href={n.link}
                  onClick={() => void openItem(n)}
                  className={`block px-4 py-3 hover:bg-paper ${
                    n.read ? "" : "bg-warning-soft/50"
                  }`}
                >
                  <NotificationRow n={n} />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => void openItem(n)}
                  className={`block w-full px-4 py-3 text-left hover:bg-paper ${
                    n.read ? "" : "bg-warning-soft/50"
                  }`}
                >
                  <NotificationRow n={n} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotificationRow({ n }: { n: AppNotification }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-ink">{n.title}</p>
        {!n.read && (
          <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-medium text-amber-900">
            Nouveau
          </span>
        )}
      </div>
      {n.body && <p className="mt-1 text-sm text-muted">{n.body}</p>}
      <p className="mt-1 text-xs text-muted/80">
        {new Date(n.createdAt).toLocaleString("fr-FR")}
      </p>
    </>
  );
}
