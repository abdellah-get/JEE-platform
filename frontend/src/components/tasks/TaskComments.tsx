"use client";

import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { TaskComment } from "@/lib/types";

type Props = {
  taskId: string;
  /** Chef projet / bureau : peut supprimer les commentaires des autres. */
  canModerate?: boolean;
  /** Mission terminée : lecture seule. */
  readOnly?: boolean;
};

export function TaskComments({ taskId, canModerate = false, readOnly = false }: Props) {
  const { accessToken, user } = useAuth();
  const toast = useToast();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [busy, setBusy] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setBusy(true);
    api
      .listTaskComments(accessToken, taskId)
      .then((data) => {
        if (!cancelled) setComments(data);
      })
      .catch(() => {
        if (!cancelled) setComments([]);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, taskId]);

  async function onPost() {
    if (!accessToken || !body.trim()) return;
    setPosting(true);
    try {
      const created = await api.createTaskComment(accessToken, taskId, body.trim());
      setComments((prev) => [...prev, created]);
      setBody("");
      toast.success("Commentaire ajouté.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Envoi impossible");
    } finally {
      setPosting(false);
    }
  }

  async function onSaveEdit(commentId: string) {
    if (!accessToken || !editBody.trim()) return;
    try {
      const updated = await api.updateTaskComment(accessToken, commentId, editBody.trim());
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingId(null);
      toast.success("Commentaire modifié.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Modification impossible");
    }
  }

  async function confirmDelete() {
    if (!accessToken || !pendingDeleteId) return;
    setDeleting(true);
    try {
      await api.deleteTaskComment(accessToken, pendingDeleteId);
      setComments((prev) => prev.filter((c) => c.id !== pendingDeleteId));
      setPendingDeleteId(null);
      toast.success("Commentaire supprimé.");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Suppression impossible");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <section className="space-y-3 border-t border-line pt-4">
      <h3 className="text-sm font-semibold text-ink">
        Commentaires{" "}
        <span className="font-normal text-muted">({comments.length})</span>
      </h3>

      {busy ? (
        <LoadingBlock label="Chargement…" />
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted">Aucun commentaire pour l’instant.</p>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => {
            const isAuthor = user?.userId === c.authorId;
            const canDelete = !readOnly && (isAuthor || canModerate);
            return (
              <li key={c.id} className="rounded-lg border border-line bg-paper/80 px-3 py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-xs font-medium text-ink">{c.authorName}</p>
                  <p className="text-[11px] text-muted">
                    {new Date(c.createdAt).toLocaleString("fr-FR")}
                  </p>
                </div>
                {editingId === c.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={3}
                      maxLength={4000}
                      className="input-field"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void onSaveEdit(c.id)}
                        className="btn btn-primary px-2 py-1 text-xs"
                      >
                        Enregistrer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-xs text-muted hover:underline"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{c.body}</p>
                )}
                {!readOnly && editingId !== c.id && (isAuthor || canDelete) && (
                  <div className="mt-1.5 flex gap-3">
                    {isAuthor && !readOnly && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditBody(c.body);
                        }}
                        className="text-[11px] text-muted hover:underline"
                      >
                        Modifier
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setPendingDeleteId(c.id)}
                        className="text-[11px] text-danger hover:underline"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {readOnly ? null : (
      <div className="space-y-2">
        <label className="block space-y-1" htmlFor="new-comment">
          <span className="text-xs font-medium text-ink/80">Ajouter un commentaire</span>
          <textarea
            id="new-comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={4000}
            placeholder="Répondre à l’équipe…"
            className="input-field"
          />
        </label>
        <button
          type="button"
          onClick={() => void onPost()}
          disabled={posting || !body.trim()}
          className="btn btn-primary text-xs"
        >
          {posting ? "Envoi…" : "Publier"}
        </button>
      </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Supprimer ce commentaire ?"
        description="Cette action est définitive."
        confirmLabel="Supprimer"
        danger
        busy={deleting}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}
