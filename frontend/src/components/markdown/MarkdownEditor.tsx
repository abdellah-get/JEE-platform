"use client";

import { useState } from "react";

import { SafeMarkdown } from "@/lib/safe-markdown";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  required?: boolean;
};

export function MarkdownEditor({
  id,
  label,
  value,
  onChange,
  rows = 8,
  required,
}: Props) {
  const [tab, setTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-ink/80">
          {label}
        </label>
        <div className="flex gap-1" role="tablist" aria-label="Édition markdown">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "edit"}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              tab === "edit" ? "bg-brand text-white" : "bg-paper text-muted"
            }`}
            onClick={() => setTab("edit")}
          >
            Éditer
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "preview"}
            className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
              tab === "preview" ? "bg-brand text-white" : "bg-paper text-muted"
            }`}
            onClick={() => setTab("preview")}
          >
            Aperçu
          </button>
        </div>
      </div>
      {tab === "edit" ? (
        <>
          <textarea
            id={id}
            required={required}
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="input-field font-mono text-sm"
            placeholder={"## Titre\nTexte avec **gras**, *italique*, et [lien](https://…)"}
          />
          <p className="text-[11px] text-muted">
            Markdown simple : titres ##, listes -, **gras**, *italique*, `code`,
            liens https.
          </p>
        </>
      ) : (
        <div className="min-h-40 rounded-lg border border-line bg-surface px-4 py-3">
          {value.trim() ? (
            <SafeMarkdown source={value} />
          ) : (
            <p className="text-sm text-muted">Rien à prévisualiser.</p>
          )}
        </div>
      )}
    </div>
  );
}
