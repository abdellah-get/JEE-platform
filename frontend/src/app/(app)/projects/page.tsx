"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canCreateProject, roleLabel, statusLabel } from "@/lib/projects";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const { accessToken, user, loading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setBusy(true);
    api
      .listProjects(accessToken)
      .then((data) => {
        if (!cancelled) setProjects(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Chargement impossible");
        }
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (loading || !user || !accessToken) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  const showCreate = canCreateProject(user.clubRole);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projets</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {showCreate
              ? "Tous les projets du club."
              : "Projets auxquels tu es affecté."}
          </p>
        </div>
        {showCreate && (
          <Link
            href="/projects/new"
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Nouveau projet
          </Link>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {busy ? (
        <p className="text-sm text-zinc-500">Chargement des projets…</p>
      ) : projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-sm text-zinc-600">Aucun projet pour le moment.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {projects.map((project) => (
            <li key={project.id}>
              <Link
                href={`/projects/${project.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 transition hover:border-zinc-300 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-zinc-900">{project.name}</p>
                    {project.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                        {project.description}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                    {statusLabel(project.status)}
                  </span>
                </div>
                <p className="mt-3 text-xs text-zinc-500">
                  Ton rôle : {roleLabel(project.myRole)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
