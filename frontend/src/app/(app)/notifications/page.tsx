"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { AppNotification, NotificationType } from "@/lib/types";

function formatNoticeWhen(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function kindMeta(type: NotificationType) {
  switch (type) {
    case "TASK_ASSIGNED":
      return { label: "Assignation", tone: "moyenne", kind: "task" };
    case "ANNOUNCEMENT_PINNED":
      return { label: "Annonce", tone: "urgente", kind: "announcement" };
    case "EVENT_PINNED":
      return { label: "Événement", tone: "actif", kind: "event" };
  }
}

function summaryLine(total: number, unread: number, unreadOnly: boolean) {
  if (unreadOnly) {
    return `${total} non lue${total > 1 ? "s" : ""}`;
  }
  const base = `${total} notification${total > 1 ? "s" : ""}`;
  if (unread <= 0) return base;
  return `${base} · ${unread} non lue${unread > 1 ? "s" : ""}`;
}

function NotificationCard({
  n,
  onOpen,
}: {
  n: AppNotification;
  onOpen: (n: AppNotification) => void;
}) {
  const meta = kindMeta(n.type);
  const className = "announcement-card surface-interactive block w-full p-4 text-left";
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-ink">
          {n.title}
        </p>
        <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
          {!n.read ? (
            <span className="chip" data-tone="actif">
              Nouveau
            </span>
          ) : null}
          <span className="chip" data-tone={meta.tone}>
            {meta.label}
          </span>
        </div>
      </div>
      {n.body ? (
        <p className="mt-2 text-sm leading-relaxed text-muted">{n.body}</p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted">
        <time dateTime={n.createdAt}>{formatNoticeWhen(n.createdAt)}</time>
        {n.link ? <span className="shrink-0 font-semibold text-brand">Ouvrir</span> : null}
      </div>
    </>
  );

  if (n.link) {
    return (
      <Link
        href={n.link}
        onClick={() => void onOpen(n)}
        data-kind={meta.kind}
        data-unread={n.read ? "false" : "true"}
        className={className}
      >
        {body}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void onOpen(n)}
      data-kind={meta.kind}
      data-unread={n.read ? "false" : "true"}
      className={className}
    >
      {body}
    </button>
  );
}

export default function NotificationsPage() {
  const { accessToken, loading } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const {
    data: pageData,
    error,
    isPending,
  } = useQuery({
    queryKey: queryKeys.notifications(unreadOnly, page),
    queryFn: () => api.listNotifications(accessToken!, unreadOnly, page),
    enabled: Boolean(accessToken),
  });
  const { data: countData } = useQuery({
    queryKey: queryKeys.unreadNotificationCount,
    queryFn: () => api.getUnreadNotificationCount(accessToken!),
    enabled: Boolean(accessToken),
  });
  const items = pageData?.content ?? [];
  const total = pageData?.totalElements ?? items.length;
  const unread = countData?.count ?? items.filter((n) => !n.read).length;

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

  function showAll() {
    setUnreadOnly(false);
    setPage(0);
  }

  function showUnread() {
    setUnreadOnly(true);
    setPage(0);
  }

  const errorMessage =
    error instanceof ApiError ? error.message : error ? "Chargement impossible" : null;
  const inboxEmpty = !unreadOnly && page === 0 && total === 0 && !isPending;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Alertes"
        title="Notifications"
        description="Assignations et annonces urgentes."
        actions={
          unread > 0 ? (
            <button
              type="button"
              onClick={() => void markAll.mutateAsync()}
              disabled={markAll.isPending}
              className="btn btn-secondary"
            >
              Tout marquer lu
            </button>
          ) : null
        }
      />

      {errorMessage && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {isPending ? (
        <LoadingBlock label="Chargement des notifications…" />
      ) : errorMessage && items.length === 0 ? null : inboxEmpty ? (
        <EmptyState
          title="Aucune notification"
          description="Tu seras prévenu lors d’une assignation ou d’une annonce épinglée."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/tasks" className="btn btn-secondary">
                Mes tâches
              </Link>
              <Link href="/announcements" className="btn btn-secondary">
                Annonces
              </Link>
            </div>
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les notifications">
            <button
              type="button"
              className="chip chip-filter"
              aria-pressed={!unreadOnly}
              onClick={showAll}
            >
              Toutes
            </button>
            <button
              type="button"
              className="chip chip-filter"
              aria-pressed={unreadOnly}
              onClick={showUnread}
            >
              Non lues
            </button>
          </div>
          {items.length === 0 ? (
            <EmptyState
              title="Aucune notification non lue"
              description="Tout est déjà lu. Les prochaines assignations et annonces épinglées reviendront ici."
              compact
              action={
                <button type="button" className="text-sm font-medium underline" onClick={showAll}>
                  Voir toutes
                </button>
              }
            />
          ) : (
            <>
              <p className="text-sm text-muted">{summaryLine(total, unread, unreadOnly)}</p>
              <ul className="stagger-list space-y-3">
                {items.map((n) => (
                  <li key={n.id}>
                    <NotificationCard n={n} onOpen={openItem} />
                  </li>
                ))}
              </ul>
            </>
          )}
          <PaginationBar
            page={pageData?.page ?? page}
            totalPages={pageData?.totalPages ?? 0}
            totalElements={pageData?.totalElements ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
