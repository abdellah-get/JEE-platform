"use client";

import { FormEvent, useEffect, useState } from "react";

import { Field } from "@/components/auth/Field";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";

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
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  if (loading || !user || !accessToken) {
    return <LoadingBlock />;
  }

  const token = accessToken;

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setSavingProfile(true);
    try {
      const me = await api.updateMe(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
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

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
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
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Profil</h1>
        <p className="text-sm text-zinc-600">
          Mets à jour tes infos ou ton mot de passe.
        </p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Identité
        </h2>
        <form onSubmit={onSaveProfile} className="space-y-4" noValidate>
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
          <p className="text-sm text-zinc-600">
            <span className="text-zinc-500">Email :</span> {user.email}
          </p>
          <p className="text-sm text-zinc-600">
            <span className="text-zinc-500">Rôle :</span> {user.clubRole}
          </p>

          {profileError ? (
            <p
              id="profile-error"
              role="alert"
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {profileError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={savingProfile}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {savingProfile ? "Enregistrement…" : "Enregistrer"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Mot de passe
        </h2>
        <form onSubmit={onChangePassword} className="space-y-4" noValidate>
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
              className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {passwordError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={savingPassword}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            {savingPassword ? "Modification…" : "Changer le mot de passe"}
          </button>
        </form>
      </section>
    </div>
  );
}
