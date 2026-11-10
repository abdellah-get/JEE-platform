"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import * as api from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { SearchHit } from "@/lib/types";

const OPEN_EVENT = "jee:open-search";

const TYPE_LABEL: Record<SearchHit["type"], string> = {
  PROJECT: "Projet",
  TASK: "Tâche",
  ANNOUNCEMENT: "Annonce",
  MEMBER: "Membre",
};

export function SearchTrigger({ variant = "desktop" }: { variant?: "desktop" | "mobile" }) {
  if (variant === "mobile") {
    return (
      <button
        type="button"
        className="btn btn-secondary px-3 py-1.5 text-xs md:hidden"
        onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
        aria-label="Rechercher"
      >
        Chercher
      </button>
    );
  }
  return (
    <button
      type="button"
      className="btn btn-secondary hidden items-center gap-2 px-3 py-1.5 text-xs md:inline-flex"
      onClick={() => window.dispatchEvent(new Event(OPEN_EVENT))}
      aria-haspopup="dialog"
    >
      Rechercher
      <kbd className="rounded border border-line bg-paper px-1.5 py-0.5 font-sans text-[10px] text-muted">
        ⌘K
      </kbd>
    </button>
  );
}

/** Mount once in AppShell — dialog + ⌘K listener. */
export function CommandPaletteHost() {
  const { accessToken } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  useFocusTrap(dialogRef, open);

  const trimmed = query.trim();
  const { data, isFetching } = useQuery({
    queryKey: queryKeys.search(trimmed),
    queryFn: () => api.search(accessToken!, trimmed),
    enabled: Boolean(accessToken) && open && trimmed.length >= 2,
  });
  const results = data?.results ?? [];

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener(OPEN_EVENT, onOpen);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOpen);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      queueMicrotask(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [trimmed]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/35 p-4 pt-[12vh] backdrop-blur-[2px]">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-[var(--shadow-lift)]"
      >
        <h2 id={titleId} className="sr-only">
          Recherche globale
        </h2>
        <div className="border-b border-line px-3 py-2">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Projets, tâches, annonces…"
            className="input-field w-full border-0 bg-transparent shadow-none focus:ring-0"
            aria-autocomplete="list"
            aria-controls="command-palette-results"
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter" && results[active]) {
                e.preventDefault();
                go(results[active].href);
              }
            }}
          />
        </div>
        <ul id="command-palette-results" role="listbox" className="max-h-80 overflow-y-auto p-2">
          {trimmed.length < 2 ? (
            <li className="px-3 py-4 text-sm text-muted">Tape au moins 2 caractères.</li>
          ) : isFetching && results.length === 0 ? (
            <li className="px-3 py-4 text-sm text-muted">Recherche…</li>
          ) : results.length === 0 ? (
            <li className="px-3 py-4 text-sm text-muted">Aucun résultat.</li>
          ) : (
            results.map((hit, index) => (
              <li key={`${hit.type}-${hit.id}`} role="option" aria-selected={index === active}>
                <Link
                  href={hit.href}
                  className={`block rounded-xl px-3 py-2.5 ${
                    index === active ? "bg-brand-soft text-ink" : "hover:bg-brand-mist"
                  }`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => setOpen(false)}
                >
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
                    {TYPE_LABEL[hit.type]}
                  </p>
                  <p className="font-medium text-ink">{hit.title}</p>
                  {hit.subtitle ? (
                    <p className="truncate text-xs text-muted">{hit.subtitle}</p>
                  ) : null}
                </Link>
              </li>
            ))
          )}
        </ul>
        <div className="flex justify-end border-t border-line px-3 py-2">
          <button type="button" className="btn btn-ghost text-xs" onClick={() => setOpen(false)}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
