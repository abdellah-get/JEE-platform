"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import * as api from "@/lib/api";
import {
  clearSession,
  getStoredUser,
  saveSession,
  scrubLegacyAccessTokenStorage,
} from "@/lib/auth-storage";
import type { AuthResponse, AuthUser } from "@/lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<{ pendingApproval: boolean; message: string }>;
  logout: () => Promise<void>;
  /** Re-run cookie refresh after a transient API failure (no logout). */
  resumeSession: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  updateLocalUser: (user: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function toUser(res: AuthResponse): AuthUser {
  return {
    userId: res.userId,
    email: res.email,
    firstName: res.firstName,
    lastName: res.lastName,
    clubRole: res.clubRole,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const applyAuth = useCallback((res: AuthResponse) => {
    const nextUser = toUser(res);
    saveSession(res.accessToken, nextUser);
    setAccessToken(res.accessToken);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    api.setAuthSessionHandlers({
      onRefreshed: applyAuth,
      onCleared: () => {
        setAccessToken(null);
        setUser(null);
        const next =
          typeof window !== "undefined"
            ? `${window.location.pathname}${window.location.search}`
            : "/dashboard";
        const dest =
          next.startsWith("/login") || next.startsWith("/register")
            ? "/login"
            : `/login?next=${encodeURIComponent(next)}`;
        router.replace(dest);
      },
    });
    return () => api.setAuthSessionHandlers({});
  }, [applyAuth, router]);

  useEffect(() => {
    let cancelled = false;
    scrubLegacyAccessTokenStorage();
    // Optimistic UI from cached profile; access JWT always rehydrated via HttpOnly refresh.
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }

    const redirectToLogin = () => {
      const path =
        typeof window !== "undefined" ? window.location.pathname : "";
      if (
        path &&
        !path.startsWith("/login") &&
        !path.startsWith("/register") &&
        !path.startsWith("/forgot-password") &&
        !path.startsWith("/reset-password")
      ) {
        router.replace(
          `/login?next=${encodeURIComponent(
            `${path}${window.location.search}`,
          )}`,
        );
      }
    };

    const hydrate = async (attempt = 0): Promise<void> => {
      try {
        const res = await api.refresh();
        if (!cancelled) applyAuth(res);
      } catch (err) {
        if (cancelled) return;
        const expired =
          err instanceof api.ApiError &&
          (err.status === 401 || err.status === 403);
        if (expired) {
          clearSession();
          setAccessToken(null);
          setUser(null);
          // Middleware may still show app chrome via cookie — force login.
          redirectToLogin();
          return;
        }
        // Cold start / 429 / network: retry before giving up (never treat as logout).
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          if (!cancelled) await hydrate(attempt + 1);
        }
      }
    };

    void hydrate().finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // Boot once on mount — do not re-run on router identity changes (would race refresh rotation).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional mount-only hydrate
  }, [applyAuth]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login({ email, password });
      applyAuth(res);
      // Navigation handled by the caller (supports ?next=)
    },
    [applyAuth],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
    }) => {
      const res = await api.register(input);
      if (res.pendingApproval || !res.accessToken) {
        return {
          pendingApproval: true,
          message:
            res.message ||
            "Compte créé. En attente d'activation par le bureau.",
        };
      }
      applyAuth({
        accessToken: res.accessToken,
        tokenType: res.tokenType ?? "Bearer",
        expiresInMinutes: res.expiresInMinutes,
        userId: res.userId!,
        email: res.email!,
        firstName: res.firstName!,
        lastName: res.lastName!,
        clubRole: res.clubRole!,
      });
      router.replace("/dashboard");
      return { pendingApproval: false, message: res.message };
    },
    [applyAuth, router],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore network errors on logout
    }
    clearSession();
    setAccessToken(null);
    setUser(null);
    router.replace("/login");
  }, [router]);

  const updateLocalUser = useCallback(
    (next: AuthUser) => {
      if (!accessToken) return;
      saveSession(accessToken, next);
      setUser(next);
    },
    [accessToken],
  );

  const resumeSession = useCallback(async () => {
    try {
      const res = await api.refresh();
      applyAuth(res);
      return true;
    } catch (err) {
      const expired =
        err instanceof api.ApiError &&
        (err.status === 401 || err.status === 403);
      if (expired) {
        clearSession();
        setAccessToken(null);
        setUser(null);
        router.replace("/login");
      }
      return false;
    }
  }, [applyAuth, router]);

  const refreshProfile = useCallback(async () => {
    if (!accessToken) return;
    const me = await api.getMe(accessToken);
    updateLocalUser(api.meToAuthUser(me));
  }, [accessToken, updateLocalUser]);

  const value = useMemo(
    () => ({
      user,
      accessToken,
      loading,
      login,
      register,
      logout,
      resumeSession,
      refreshProfile,
      updateLocalUser,
    }),
    [
      user,
      accessToken,
      loading,
      login,
      register,
      logout,
      resumeSession,
      refreshProfile,
      updateLocalUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
