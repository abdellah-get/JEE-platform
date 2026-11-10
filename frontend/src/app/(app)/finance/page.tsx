"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PaginationBar } from "@/components/ui/PaginationBar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canAccessAdmin } from "@/lib/auth-storage";
import { queryKeys } from "@/lib/query-keys";
import type { ExpenseClaimStatus } from "@/lib/types";

function formatMoney(cents: number, currency = "MAD") {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default function FinancePage() {
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const isBureau = canAccessAdmin(user?.clubRole);
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState<"" | ExpenseClaimStatus>("PENDING");
  const [exporting, setExporting] = useState(false);

  const summaryQuery = useQuery({
    queryKey: queryKeys.financeSummary,
    queryFn: () => api.getFinanceSummary(accessToken!),
    enabled: Boolean(accessToken && isBureau),
  });

  const expensesQuery = useQuery({
    queryKey: queryKeys.financeExpenses(page, status || undefined),
    queryFn: () =>
      api.listFinanceExpenses(accessToken!, page, status || undefined),
    enabled: Boolean(accessToken && isBureau),
  });

  const decide = useMutation({
    mutationFn: ({
      id,
      decision,
    }: {
      id: string;
      decision: ExpenseClaimStatus;
    }) => api.decideExpenseClaim(accessToken!, id, { status: decision }),
    onSuccess: () => {
      toast.success("Décision enregistrée.");
      void qc.invalidateQueries({ queryKey: ["finance-expenses"] });
      void qc.invalidateQueries({ queryKey: queryKeys.financeSummary });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Décision impossible"),
  });

  async function handleExport() {
    if (!accessToken || exporting) return;
    setExporting(true);
    try {
      await api.downloadFinanceExportCsv(accessToken);
      toast.success("Export finance téléchargé.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Export impossible");
    } finally {
      setExporting(false);
    }
  }

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  if (!isBureau) {
    return (
      <EmptyState
        title="Finance club"
        description="Les notes de frais se soumettent depuis la page Finance d’un projet. La validation reste réservée au bureau."
        action={
          <Link href="/projects" className="text-sm font-medium underline">
            Voir les projets
          </Link>
        }
      />
    );
  }

  const summary = summaryQuery.data;
  const claims = expensesQuery.data?.content ?? [];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">Finance</h1>
          <p className="mt-1 text-sm text-muted">
            Budgets projets et validation des notes de frais.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={exporting}
          onClick={() => void handleExport()}
        >
          {exporting ? "Export…" : "Export CSV"}
        </button>
      </div>

      {summaryQuery.isPending ? (
        <LoadingBlock rows={2} />
      ) : summary ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="surface-quiet p-4">
            <p className="text-xs uppercase tracking-wide text-muted">Budgets</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
              {formatMoney(summary.totalBudgetCents)}
            </p>
          </div>
          <div className="surface-quiet p-4">
            <p className="text-xs uppercase tracking-wide text-muted">
              Dépenses approuvées
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
              {formatMoney(summary.totalApprovedExpensesCents)}
            </p>
          </div>
          <div className="surface-quiet p-4">
            <p className="text-xs uppercase tracking-wide text-muted">En attente</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-ink">
              {summary.pendingClaimsCount}
            </p>
          </div>
        </div>
      ) : null}

      {summary && summary.budgets.length > 0 ? (
        <section className="panel space-y-3">
          <h2 className="section-heading">Résumé par projet</h2>
          <ul className="space-y-2">
            {summary.budgets.map((b) => (
              <li key={b.projectId}>
                <Link
                  href={`/projects/${b.projectId}/finance`}
                  className="list-row flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="font-medium text-ink">{b.projectName}</span>
                  <span className="text-sm text-muted tabular-nums">
                    {formatMoney(b.approvedExpensesCents, b.currency)} /{" "}
                    {formatMoney(b.amountCents, b.currency)}
                    <span
                      className={
                        b.remainingCents < 0 ? " ml-2 text-danger" : " ml-2"
                      }
                    >
                      (reste {formatMoney(b.remainingCents, b.currency)})
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="section-heading">Notes de frais</h2>
          <label className="space-y-1 text-sm">
            <span className="sr-only">Filtrer statut</span>
            <select
              className="input-field"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "" | ExpenseClaimStatus);
                setPage(0);
              }}
            >
              <option value="">Tous</option>
              <option value="PENDING">En attente</option>
              <option value="APPROVED">Approuvées</option>
              <option value="REJECTED">Refusées</option>
            </select>
          </label>
        </div>

        {expensesQuery.isPending ? (
          <LoadingBlock rows={3} />
        ) : claims.length === 0 ? (
          <EmptyState
            title="Aucune note"
            description="Les soumissions des membres apparaîtront ici."
          />
        ) : (
          <ul className="space-y-2">
            {claims.map((c) => (
              <li key={c.id} className="surface-quiet space-y-2 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">
                      {c.projectName} · {formatMoney(c.amountCents)}
                    </p>
                    <p className="text-sm text-muted">
                      {c.submitterName} · {c.category}
                    </p>
                    <p className="mt-1 text-sm text-ink">{c.description}</p>
                  </div>
                  <span className="chip text-xs">{c.status}</span>
                </div>
                {c.status === "PENDING" ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={decide.isPending}
                      onClick={() =>
                        decide.mutate({ id: c.id, decision: "APPROVED" })
                      }
                    >
                      Approuver
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      disabled={decide.isPending}
                      onClick={() =>
                        decide.mutate({ id: c.id, decision: "REJECTED" })
                      }
                    >
                      Refuser
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {expensesQuery.data ? (
          <PaginationBar
            page={page}
            totalPages={expensesQuery.data.totalPages}
            totalElements={expensesQuery.data.totalElements}
            onPageChange={setPage}
          />
        ) : null}
      </section>
    </div>
  );
}
