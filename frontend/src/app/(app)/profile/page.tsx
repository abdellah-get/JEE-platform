"use client";

import { FormEvent, useEffect, useState } from "react";

import { Field } from "@/components/auth/Field";
import { useAuth } from "@/context/AuthContext";
import * as api from "@/lib/api";
import { ApiError } from "@/lib/api";

export default function ProfilePage() {
  const { user, loading, accessToken, updateLocalUser } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName);
      setLastName(user.lastName);
    }
  }, [user]);

  if (loading || !user || !accessToken) {
    return <p className="text-sm text-zinc-500">Chargement…</p>;
  }

  const token = accessToken;

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setProfileError(null);
    setSavingProfile(true);
    try {
      const me = await api.updateMe(token, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      updateLocalUser(api.meToAuthUser(me));
      setProfileMsg("Profil mis à jour.");
    } catch (err) {
      setProfileError(
        err instanceof ApiError ? err.message : "Mise à jour impossible",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordMsg(null);
    setPasswordError(null);
    setSavingPassword(true);
    try {
      await api.changePassword(token, {
        currentPassword,
        newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordMsg("Mot de passe modifié.");
    } catch (err) {
      setPasswordError(
        err instanceof ApiError ? err.message : "Changement impossible",
      );
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
        <form onSubmit={onSaveProfile} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="firstName"
              label="Prénom"
              value={firstName}
              onChange={setFirstName}
              required
            />
            <Field
              id="lastName"
              label="Nom"
              value={lastName}
              onChange={setLastName}
              required
            />
          </div>
          <p className="text-sm text-zinc-600">
            <span className="text-zinc-500">Email :</span> {user.email}
          </p>
          <p className="text-sm text-zinc-600">
            <span className="text-zinc-500">Rôle :</span> {user.clubRole}
          </p>

          {profileError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {profileError}
            </p>
          ) : null}
          {profileMsg ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {profileMsg}
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
        <form onSubmit={onChangePassword} className="space-y-4">
          <Field
            id="currentPassword"
            label="Mot de passe actuel"
            type="password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
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
          />

          {passwordError ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {passwordError}
            </p>
          ) : null}
          {passwordMsg ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {passwordMsg}
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
