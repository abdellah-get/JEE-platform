import type { AuthUser, ClubRole } from "./types";
import { AUTH_COOKIE, ROLE_COOKIE } from "./auth-constants";

export { AUTH_COOKIE, ROLE_COOKIE };

/** Legacy key — purged on save/clear/boot (XSS: never persist the JWT). */
const LEGACY_TOKEN_KEY = "jee_access_token";
const USER_KEY = "jee_user";

/**
 * Middleware hint only (not a secret). Aligned with refresh cookie TTL (~7j)
 * so a reload can reach the app and resume via HttpOnly refresh.
 */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

/** Access JWT — process memory only (lost on full page reload; restored via refresh). */
let memoryAccessToken: string | null = null;

function purgeLegacyAccessToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function getAccessToken(): string | null {
  return memoryAccessToken;
}

export function getStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function setClientCookie(name: string, value: string, maxAge: number) {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function clearClientCookie(name: string) {
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function saveSession(accessToken: string, user: AuthUser) {
  memoryAccessToken = accessToken;
  if (typeof window === "undefined") return;
  purgeLegacyAccessToken();
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setClientCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
  setClientCookie(ROLE_COOKIE, user.clubRole, COOKIE_MAX_AGE);
}

export function clearSession() {
  memoryAccessToken = null;
  if (typeof window === "undefined") return;
  purgeLegacyAccessToken();
  localStorage.removeItem(USER_KEY);
  clearClientCookie(AUTH_COOKIE);
  clearClientCookie(ROLE_COOKIE);
}

/** Call once on boot to scrub any JWT left from older builds. */
export function scrubLegacyAccessTokenStorage() {
  purgeLegacyAccessToken();
}

export function canAccessAdmin(role: ClubRole | null | undefined): boolean {
  return role === "BUREAU" || role === "ADMIN_TECH";
}

export function canManageClubRoles(role: ClubRole | null | undefined): boolean {
  return role === "ADMIN_TECH";
}
