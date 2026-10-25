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
    scrubLegacyAccessTokenStorage();
    // Optimistic UI from cached profile; access JWT always rehydrated via HttpOnly refresh.
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
    }

    api
      .refresh()
      .then((res) => {
        applyAuth(res);
      })
      .catch(() => {
        clearSession();
        setAccessToken(null);
        setUser(null);
      })
      .finally(() => setLoading(false));
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
