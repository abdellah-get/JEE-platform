"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canManageProject } from "@/lib/projects";
import { queryKeys } from "@/lib/query-keys";
import type { ExpenseCategory } from "@/lib/types";

function formatMoney(cents: number, currency = "MAD") {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

const CATEGORIES: ExpenseCategory[] = [
  "TRAVEL",
  "MATERIALS",
  "SOFTWARE",
  "OTHER",
];

export default function ProjectFinancePage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();

  const [budgetAmount, setBudgetAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("OTHER");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [receiptNote, setReceiptNote] = useState("");

  const projectQuery = useQuery({
    queryKey: queryKeys.project(projectId),
    queryFn: () => api.getProject(accessToken!, projectId),
    enabled: Boolean(accessToken && projectId),
  });

  const budgetQuery = useQuery({
    queryKey: queryKeys.projectBudget(projectId),
    queryFn: () => api.getProjectBudget(accessToken!, projectId),
    enabled: Boolean(accessToken && projectId),
  });

  const expensesQuery = useQuery({
    queryKey: queryKeys.projectExpenses(projectId),
    queryFn: () => api.listProjectExpenses(accessToken!, projectId),
    enabled: Boolean(accessToken && projectId),
  });

  const manage = Boolean(
    user &&
      canManageProject(user.clubRole, projectQuery.data?.myRole ?? null),
  );

  const saveBudget = useMutation({
    mutationFn: () => {
      const amountCents = Math.round(
        parseFloat(budgetAmount.replace(",", ".")) * 100,
      );
      if (!Number.isFinite(amountCents) || amountCents < 0) {
        throw new ApiError(400, "Budget invalide");
      }
      return api.upsertProjectBudget(accessToken!, projectId, { amountCents });
    },
    onSuccess: () => {
      toast.success("Budget enregistré.");
      void qc.invalidateQueries({ queryKey: queryKeys.projectBudget(projectId) });
      void qc.invalidateQueries({ queryKey: queryKeys.financeSummary });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Enregistrement impossible"),
  });

  const createExpense = useMutation({
    mutationFn: () => {
      const amountCents = Math.round(parseFloat(amount.replace(",", ".")) * 100);
      if (!Number.isFinite(amountCents) || amountCents < 1) {
        throw new ApiError(400, "Montant invalide");
      }
      return api.createProjectExpense(accessToken!, projectId, {
        category,
        amountCents,
        description: description.trim(),
        receiptNote: receiptNote.trim() || undefined,
      });
    },
    onSuccess: () => {
      setAmount("");
      setDescription("");
      setReceiptNote("");
      toast.success("Note de frais soumise.");
      void qc.invalidateQueries({
        queryKey: queryKeys.projectExpenses(projectId),
      });
      void qc.invalidateQueries({ queryKey: queryKeys.projectBudget(projectId) });
    },
    onError: (err) =>
      toast.error(err instanceof ApiError ? err.message : "Soumission impossible"),
  });

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  if (projectQuery.error && !projectQuery.data) {
    return (
      <EmptyState
        title="Projet introuvable"
        description="Accès refusé ou projet absent."
        action={
          <Link href="/projects" className="text-sm font-medium underline">
            Retour projets
          </Link>
        }
      />
    );
  }

  const project = projectQuery.data;
  const budget = budgetQuery.data;
  const expenses = expensesQuery.data ?? [];

  if (!project) {
    return <LoadingBlock label="Chargement…" />;
  }

  const usedPct =
    budget && budget.amountCents > 0
      ? Math.min(
          100,
          Math.round((budget.approvedExpensesCents / budget.amountCents) * 100),
        )
      : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/projects/${projectId}`}
          className="text-sm text-muted hover:text-ink"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-2 page-title">Finance projet</h1>
        <p className="mt-1 text-sm text-muted">
          Budget et notes de frais de cette mission.
        </p>
      </div>

      {budgetQuery.isPending ? (
        <LoadingBlock rows={2} />
      ) : budget ? (
        <section className="panel space-y-3">
          <h2 className="section-heading">Budget vs dépenses</h2>
          <p className="text-sm text-muted tabular-nums">
            Approuvé {formatMoney(budget.approvedExpensesCents, budget.currency)}{" "}
            / {formatMoney(budget.amountCents, budget.currency)}
            {" · "}
            reste {formatMoney(budget.remainingCents, budget.currency)}
          </p>
          <ProgressBar value={usedPct} label="Consommation" />
        </section>
      ) : null}

      {manage ? (
        <form
          className="flex flex-wrap items-end gap-3 surface-quiet p-4"
          onSubmit={(e) => {
            e.preventDefault();
            saveBudget.mutate();
          }}
        >
          <label className="space-y-1 text-sm">
            <span className="font-medium text-ink">Budget (MAD)</span>
            <input
              className="input-field"
              inputMode="decimal"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              placeholder={
                budget ? (budget.amountCents / 100).toFixed(2) : "0.00"
              }
              required
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saveBudget.isPending}
          >
            Enregistrer budget
          </button>
        </form>
      ) : null}

      <section className="panel space-y-3">
        <h2 className="section-heading">Soumettre une note de frais</h2>
        <form
          className="grid gap-3 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            createExpense.mutate();
          }}
        >
          <label className="space-y-1 text-sm">
            <span className="font-medium text-ink">Catégorie</span>
            <select
              className="input-field"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm">
            <span className="font-medium text-ink">Montant (MAD)</span>
            <input
              className="input-field"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium text-ink">Description</span>
            <input
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={500}
            />
          </label>
          <label className="space-y-1 text-sm sm:col-span-2">
            <span className="font-medium text-ink">Note justificatif</span>
            <input
              className="input-field"
              value={receiptNote}
              onChange={(e) => setReceiptNote(e.target.value)}
              maxLength={500}
              placeholder="Réf. facture, trajet…"
            />
          </label>
          <button
            type="submit"
            className="btn btn-primary sm:col-span-2"
            disabled={createExpense.isPending}
          >
            Soumettre
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="section-heading">Notes du projet</h2>
        {expensesQuery.isPending ? (
          <LoadingBlock rows={2} />
        ) : expenses.length === 0 ? (
          <EmptyState
            compact
            title="Aucune note"
            description="Soumets une dépense pour démarrer le suivi."
          />
        ) : (
          <ul className="space-y-2">
            {expenses.map((e) => (
              <li
                key={e.id}
                className="list-row flex flex-wrap items-start justify-between gap-2 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">
                    {formatMoney(e.amountCents)} · {e.category}
                  </p>
                  <p className="text-muted">
                    {e.submitterName} — {e.description}
                  </p>
                </div>
                <span className="chip text-xs">{e.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
