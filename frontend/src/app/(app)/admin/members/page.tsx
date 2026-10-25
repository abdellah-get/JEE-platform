"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SearchInput, matchesSearch } from "@/components/ui/SearchInput";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import type { AdminUser, PageResponse } from "@/lib/types";

export default function AdminMembersPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const [pageData, setPageData] = useState<PageResponse<AdminUser> | null>(null);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [listBusy, setListBusy] = useState(true);

  useEffect(() => {
    if (!accessToken || !canAccessAdmin(user?.clubRole)) return;
    setListBusy(true);
    setError(null);
    api
      .listAdminUsers(accessToken, page)
      .then(setPageData)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) return;
        setError(err instanceof ApiError ? err.message : "Chargement impossible");
      })
      .finally(() => setListBusy(false));
  }, [accessToken, user?.clubRole, page]);

  const users = pageData?.content ?? [];

  const filtered = useMemo(
    () =>
      users.filter((u) =>
        matchesSearch(
          query,
          u.firstName,
          u.lastName,
          `${u.firstName} ${u.lastName}`,
          u.email,
          u.clubRole,
        ),
      ),
    [users, query],
  );

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  if (!canAccessAdmin(user.clubRole)) {
    return (
      <EmptyState
        title="Accès refusé"
        description="Réservé au bureau / admin technique."
        action={
          <Link href="/dashboard" className="text-sm font-medium underline">
            Retour au dashboard
          </Link>
        }
      />
    );
  }

  async function toggleActive(target: AdminUser) {
    setError(null);
    setBusyId(target.userId);
    try {
      const updated = await api.updateUserActive(
        accessToken!,
        target.userId,
        !target.active,
      );
      setPageData((prev) =>
        prev
          ? {
              ...prev,
              content: prev.content.map((u) =>
                u.userId === updated.userId ? updated : u,
              ),
            }
          : prev,
      );
      toast.success(updated.active ? "Compte activé." : "Compte désactivé.");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Mise à jour impossible";
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          ← Admin
        </Link>
        <h1 className="mt-2 page-title">Membres</h1>
        <p className="mt-1 text-sm text-muted">
          Active ou désactive les comptes. Les inscriptions en attente
          d&apos;approbation apparaissent comme <em>Inactif</em> — clique{" "}
          <strong>Activer</strong> pour les valider.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {listBusy ? (
        <LoadingBlock label="Chargement des membres…" />
      ) : users.length === 0 ? (
        <EmptyState title="Aucun membre" description="Aucun compte enregistré." />
      ) : (
        <>
          <SearchInput
            id="members-search"
            label="Rechercher un membre"
            value={query}
            onChange={setQuery}
            placeholder="Nom, email, rôle…"
          />
          {filtered.length === 0 ? (
            <EmptyState
              title="Aucun résultat"
              description="Aucun membre ne correspond à ta recherche."
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
            <ul className="divide-y divide-line surface-quiet">
              {filtered.map((u) => (
                <li
                  key={u.userId}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {u.firstName} {u.lastName}
                      {!u.active && (
                        <span className="ml-2 rounded-full bg-warning-soft px-2 py-0.5 text-xs text-warning">
                          En attente / inactif
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {u.email} · {u.clubRole}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === u.userId || u.userId === user.userId}
                    onClick={() => toggleActive(u)}
                    className="rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-paper disabled:opacity-50"
                  >
                    {busyId === u.userId
                      ? "…"
                      : u.active
                        ? "Désactiver"
                        : "Activer"}
                  </button>
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
