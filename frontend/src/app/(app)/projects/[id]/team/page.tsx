"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import { canManageProject, roleLabel } from "@/lib/projects";
import type { Project, ProjectMember, ProjectRole, UserSummary } from "@/lib/types";

type DraftMember = { userId: string; role: ProjectRole };

export default function ProjectTeamPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const { accessToken, user, loading } = useAuth();
  const toast = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [draft, setDraft] = useState<DraftMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [addUserId, setAddUserId] = useState("");

  useEffect(() => {
    if (!accessToken || !projectId) return;
    let cancelled = false;
    Promise.all([
      api.getProject(accessToken, projectId),
      api.listProjectMembers(accessToken, projectId),
      api.listUsers(accessToken),
    ])
      .then(([p, members, directory]) => {
        if (cancelled) return;
        setProject(p);
        setDraft(members.map((m: ProjectMember) => ({ userId: m.userId, role: m.role })));
        setUsers(directory);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError
              ? err.status === 404
                ? "Projet introuvable ou accès refusé."
                : err.message
              : "Chargement impossible",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, projectId]);

  const userMap = useMemo(
    () => new Map(users.map((u) => [u.userId, u])),
    [users],
  );

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        <Link href="/projects" className="text-sm text-muted hover:text-ink">
          ← Projets
        </Link>
        <p className="rounded-lg border border-red-200 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      </div>
    );
  }

  if (!project) {
    return <LoadingBlock />;
  }

  const manage = canManageProject(user.clubRole, project.myRole);
  const available = users.filter((u) => !draft.some((d) => d.userId === u.userId));

  function setRole(userId: string, role: ProjectRole) {
    setDraft((prev) =>
      prev.map((m) => {
        if (role === "CHEF_PROJET") {
          return m.userId === userId
            ? { ...m, role }
            : { ...m, role: "CONTRIBUTEUR" };
        }
        return m.userId === userId ? { ...m, role } : m;
      }),
    );
  }

  function removeMember(userId: string) {
    setDraft((prev) => prev.filter((m) => m.userId !== userId));
  }

  function addMember() {
    if (!addUserId) return;
    setDraft((prev) => [...prev, { userId: addUserId, role: "CONTRIBUTEUR" }]);
    setAddUserId("");
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setError(null);
    setSaving(true);
    try {
      const saved = await api.replaceProjectMembers(accessToken!, projectId, draft);
      setDraft(saved.map((m) => ({ userId: m.userId, role: m.role })));
      setMsg("Équipe enregistrée.");
      toast.success("Équipe enregistrée.");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Enregistrement impossible";
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/projects/${project.id}`}
          className="text-sm text-muted hover:text-ink"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-2 page-title">Équipe</h1>
        <p className="mt-1 text-sm text-muted">
          {manage
            ? "Ajoute ou retire des membres, un seul chef de projet."
            : "Lecture seule — seul le chef ou le bureau peut modifier."}
        </p>
      </div>

      <form onSubmit={onSave} className="space-y-4 surface-quiet p-5">
        {draft.length === 0 ? (
          <p className="text-sm text-muted">Aucun membre.</p>
        ) : (
          <ul className="divide-y divide-line">
            {draft.map((m) => {
              const u = userMap.get(m.userId);
              return (
                <li
                  key={m.userId}
                  className="flex flex-wrap items-center justify-between gap-3 py-3"
                >
                  <div className="text-sm">
                    <p className="font-medium">
                      {u ? `${u.firstName} ${u.lastName}` : m.userId}
                    </p>
                    <p className="text-muted">{u?.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {manage ? (
                      <>
                        <select
                          value={m.role}
                          onChange={(e) =>
                            setRole(m.userId, e.target.value as ProjectRole)
                          }
                          className="rounded-lg border border-line px-2 py-1 text-sm"
                        >
                          <option value="CHEF_PROJET">Chef de projet</option>
                          <option value="CONTRIBUTEUR">Contributeur</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeMember(m.userId)}
                          className="text-sm text-red-600 hover:underline"
                        >
                          Retirer
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-muted">{roleLabel(m.role)}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {manage && (
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <select
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              className="min-w-[220px] flex-1 rounded-lg border border-line px-3 py-2 text-sm"
            >
              <option value="">Ajouter un membre…</option>
              {available.map((u) => (
                <option key={u.userId} value={u.userId}>
                  {u.firstName} {u.lastName} ({u.email})
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={addMember}
              disabled={!addUserId}
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium hover:bg-paper disabled:opacity-50"
            >
              Ajouter
            </button>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-emerald-700">{msg}</p>}

        {manage && (
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? "Enregistrement…" : "Enregistrer l’équipe"}
          </button>
        )}
      </form>
    </div>
  );
}
