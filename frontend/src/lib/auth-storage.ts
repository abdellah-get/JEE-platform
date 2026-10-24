import type { AuthUser, ClubRole } from "./types";
import { AUTH_COOKIE, ROLE_COOKIE } from "./auth-constants";

export { AUTH_COOKIE, ROLE_COOKIE };

const TOKEN_KEY = "jee_access_token";
const USER_KEY = "jee_user";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
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
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  setClientCookie(AUTH_COOKIE, "1", COOKIE_MAX_AGE);
  setClientCookie(ROLE_COOKIE, user.clubRole, COOKIE_MAX_AGE);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  clearClientCookie(AUTH_COOKIE);
  clearClientCookie(ROLE_COOKIE);
}

export function canAccessAdmin(role: ClubRole | null | undefined): boolean {
  return role === "BUREAU" || role === "ADMIN_TECH";
}
