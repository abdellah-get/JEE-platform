"use client";

import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { ProjectAttachment } from "@/lib/types";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

type Props = {
  projectId: string;
  accessToken: string;
  currentUserId: string;
  canDeleteAny: boolean;
};

export function ProjectAttachments({
  projectId,
  accessToken,
  currentUserId,
  canDeleteAny,
}: Props) {
  const toast = useToast();
  const [items, setItems] = useState<ProjectAttachment[]>([]);
  const [busy, setBusy] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ProjectAttachment | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBusy(true);
    api
      .listProjectAttachments(accessToken, projectId)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(
            err instanceof ApiError ? err.message : "Chargement impossible",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, projectId]);

  async function onUpload(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const created = await api.uploadProjectAttachment(
        accessToken,
        projectId,
        file,
      );
      setItems((prev) => [created, ...prev]);
      toast.success("Fichier ajouté.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Upload impossible");
    } finally {
      setUploading(false);
    }
  }

  async function onDownload(item: ProjectAttachment) {
    try {
      await api.downloadProjectAttachment(
        accessToken,
        projectId,
        item.id,
        item.originalName,
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Téléchargement impossible",
      );
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.deleteProjectAttachment(
        accessToken,
        projectId,
        pendingDelete.id,
      );
      setItems((prev) => prev.filter((a) => a.id !== pendingDelete.id));
      setPendingDelete(null);
      toast.success("Fichier supprimé.");
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Suppression impossible",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="surface-quiet p-5" aria-label="Livrables">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-ink">Livrables / pièces jointes</h2>
        <label className="btn btn-secondary cursor-pointer text-xs">
          {uploading ? "Envoi…" : "Ajouter un fichier"}
          <input
            type="file"
            className="sr-only"
            disabled={uploading}
            accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.doc,.docx,.xls,.xlsx,.zip"
            onChange={(e) => {
              void onUpload(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      <p className="mt-1 text-xs text-muted">
        PDF, images, Office, ZIP — max 5 Mo. Visible par l’équipe du projet.
      </p>

      {busy ? (
        <div className="mt-3">
          <LoadingBlock label="Chargement des fichiers…" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            compact
            title="Aucun livrable"
            description="Dépose un PV, maquette ou export pour le partager à l’équipe."
          />
        </div>
      ) : (
        <ul className="mt-3 divide-y divide-line">
          {items.map((item) => {
            const canDelete =
              canDeleteAny || item.uploadedById === currentUserId;
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">
                    {item.originalName}
                  </p>
                  <p className="text-xs text-muted">
                    {formatSize(item.sizeBytes)} · {item.uploadedByName} ·{" "}
                    {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void onDownload(item)}
                    className="text-xs font-medium underline"
                  >
                    Télécharger
                  </button>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={() => setPendingDelete(item)}
                      className="text-xs text-danger underline"
                    >
                      Supprimer
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Supprimer ce fichier ?"
        description={
          pendingDelete
            ? `« ${pendingDelete.originalName} » sera retiré du projet.`
            : undefined
        }
        confirmLabel="Supprimer"
        danger
        busy={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
