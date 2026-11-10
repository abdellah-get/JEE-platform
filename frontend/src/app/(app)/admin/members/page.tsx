"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { SearchInput, matchesSearch } from "@/components/ui/SearchInput";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import { formatPersonName } from "@/lib/names";
import { queryKeys } from "@/lib/query-keys";

export default function AdminMembersPage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: pageData, error, isPending: listBusy } = useQuery({
    queryKey: queryKeys.adminUsers(page),
    queryFn: () => api.listAdminUsers(accessToken!, page),
    enabled: Boolean(accessToken && canAccessAdmin(user?.clubRole)),
  });
  const errorMessage =
    error instanceof ApiError ? error.message : error ? "Chargement impossible" : null;

  const users = useMemo(
    () =>
      (pageData?.content ?? []).filter((u) => u.membershipStatus !== "PENDING"),
    [pageData],
  );

  const filtered = useMemo(
    () =>
      users.filter((u) =>
        matchesSearch(
          query,
          formatPersonName(u.firstName, u.lastName),
          u.firstName,
          u.lastName,
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

  async function toggleActive(target: { userId: string; active: boolean }) {
    setBusyId(target.userId);
    try {
      const updated = await api.updateUserActive(
        accessToken!,
        target.userId,
        !target.active,
      );
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success(updated.active ? "Compte activé." : "Compte désactivé.");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Mise à jour impossible";
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
          Les nouvelles demandes se traitent sur{" "}
          <Link href="/admin/requests" className="font-medium text-ink underline">
            Demandes d’adhésion
          </Link>
          . Cette page active ou désactive les comptes existants.
        </p>
      </div>

      {errorMessage && (
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
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
                    <p className="text-sm font-medium text-ink">
                      {formatPersonName(u.firstName, u.lastName)}
                      {u.membershipStatus === "REJECTED" && (
                        <span className="chip ml-2">Refusée</span>
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
