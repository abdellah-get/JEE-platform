"use client";

import { FormEvent, useEffect, useState } from "react";

import { Field } from "@/components/auth/Field";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/ui/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";
import type { ClubRole } from "@/lib/types";

function clubRoleLabel(role: ClubRole) {
  switch (role) {
    case "MEMBRE":
      return "Membre";
    case "BUREAU":
      return "Bureau";
    case "ADMIN_TECH":
      return "Admin technique";
  }
}

function clubRoleTone(role: ClubRole) {
  switch (role) {
    case "MEMBRE":
      return "actif";
    case "BUREAU":
      return "urgente";
    case "ADMIN_TECH":
      return "haute";
  }
}

function initials(firstName: string, lastName: string) {
  const letters = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  return letters || "·";
}

export default function ProfilePage() {
  const { user, loading, accessToken, updateLocalUser } = useAuth();
  const toast = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    // Only when the account changes. A token refresh must not wipe a draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed the form once per user
  }, [user?.userId]);

  if (loading || !user || !accessToken) {
    return <LoadingBlock label="Chargement du profil…" />;
  }

  const token = accessToken;
  const displayName = `${firstName.trim()} ${lastName.trim()}`.trim() || user.email;

  function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    void saveProfile();
  }

  async function saveProfile() {
    setProfileError(null);
    setSavingProfile(true);
    try {
      const me = await api.updateMe(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      setFirstName(me.firstName);
      setLastName(me.lastName);
      updateLocalUser(api.meToAuthUser(me));
      toast.success("Profil mis à jour.");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Mise à jour impossible";
      setProfileError(message);
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  }

  function onChangePassword(e: FormEvent) {
    e.preventDefault();
    void savePassword();
  }

  async function savePassword() {
    setPasswordError(null);
    if (newPassword.trim().length < 8) {
      setPasswordError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(token, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Mot de passe modifié.");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Changement impossible";
      setPasswordError(message);
      toast.error(message);
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Compte & sécurité"
        title="Profil"
        description="Mets à jour tes infos ou ton mot de passe."
      />

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <section className="surface-quiet p-5">
          <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-ink">
            Identité
          </h2>
          <div className="mt-4 flex items-center gap-3">
            <span className="profile-mark" aria-hidden>
              {initials(firstName, lastName)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight text-ink">
                {displayName}
              </p>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>

          <form onSubmit={onSaveProfile} className="mt-5 space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field
                id="firstName"
                label="Prénom"
                value={firstName}
                onChange={setFirstName}
                required
                describedBy={profileError ? "profile-error" : undefined}
                invalid={!!profileError}
              />
              <Field
                id="lastName"
                label="Nom"
                value={lastName}
                onChange={setLastName}
                required
                describedBy={profileError ? "profile-error" : undefined}
                invalid={!!profileError}
              />
            </div>
            <label className="block space-y-1.5" htmlFor="email">
              <span className="text-sm font-semibold text-ink">Email</span>
              <input
                id="email"
                value={user.email}
                readOnly
                className="input-field"
              />
            </label>
            <p className="flex items-center gap-2 text-sm text-muted">
              <span>Rôle</span>
              <span className="chip" data-tone={clubRoleTone(user.clubRole)}>
                {clubRoleLabel(user.clubRole)}
              </span>
            </p>

            {profileError ? (
              <p
                id="profile-error"
                role="alert"
                className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {profileError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void saveProfile()}
              disabled={savingProfile}
              className="btn btn-primary"
            >
              {savingProfile ? "Enregistrement…" : "Enregistrer"}
            </button>
          </form>
        </section>

        <section className="surface-quiet p-5">
          <h2 className="font-[family-name:var(--font-syne)] text-base font-semibold tracking-tight text-ink">
            Mot de passe
          </h2>
          <p className="mt-1 text-sm text-muted">
            L’ancien mot de passe est demandé pour confirmer que c’est bien toi.
          </p>
          <form onSubmit={onChangePassword} className="mt-5 space-y-4" noValidate>
            <Field
              id="currentPassword"
              label="Mot de passe actuel"
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
              required
              describedBy={passwordError ? "password-error" : undefined}
              invalid={!!passwordError}
            />
            <Field
              id="newPassword"
              label="Nouveau mot de passe (min. 8)"
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
              required
              minLength={8}
              describedBy={passwordError ? "password-error" : undefined}
              invalid={!!passwordError}
            />

            {passwordError ? (
              <p
                id="password-error"
                role="alert"
                className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger"
              >
                {passwordError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => void savePassword()}
              disabled={savingPassword}
              className="btn btn-primary"
            >
              {savingPassword ? "Modification…" : "Changer le mot de passe"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
