"use client";

import { useEffect, useRef, useState } from "react";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import * as api from "@/lib/api";
import type { ProjectAttachment } from "@/lib/types";

type Props = {
  open: boolean;
  projectId: string;
  accessToken: string;
  item: ProjectAttachment | null;
  onClose: () => void;
};

function isImage(type: string) {
  return type.startsWith("image/");
}

function isPdf(type: string, name: string) {
  return type === "application/pdf" || name.toLowerCase().endsWith(".pdf");
}

export function canPreviewAttachment(item: ProjectAttachment) {
  return isImage(item.contentType) || isPdf(item.contentType, item.originalName);
}

export function AttachmentPreview({
  open,
  projectId,
  accessToken,
  item,
  onClose,
}: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open || !item) {
      setUrl(null);
      setError(null);
      return;
    }
    let revoked: string | null = null;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void api
      .fetchProjectAttachmentBlob(accessToken, projectId, item.id)
      .then((blob) => {
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        revoked = objectUrl;
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError("Aperçu impossible.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [open, item, accessToken, projectId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-ink/50 backdrop-blur-[1px]"
        aria-label="Fermer l’aperçu"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Aperçu — ${item.originalName}`}
        className="relative z-10 flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <p className="truncate text-sm font-semibold text-ink">{item.originalName}</p>
          <button type="button" className="btn btn-secondary px-2 py-1 text-xs" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="flex min-h-64 flex-1 items-center justify-center bg-paper p-3">
          {loading ? (
            <p className="text-sm text-muted">Chargement…</p>
          ) : error ? (
            <p className="text-sm text-danger">{error}</p>
          ) : url && isImage(item.contentType) ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob preview
            <img
              src={url}
              alt={item.originalName}
              className="max-h-[70dvh] max-w-full object-contain"
            />
          ) : url && isPdf(item.contentType, item.originalName) ? (
            <iframe
              title={item.originalName}
              src={url}
              className="h-[70dvh] w-full rounded-md border border-line bg-white"
            />
          ) : (
            <p className="text-sm text-muted">Aperçu non disponible pour ce type.</p>
          )}
        </div>
      </div>
    </div>
  );
}
