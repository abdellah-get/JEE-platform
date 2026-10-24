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
  getAccessToken,
  getStoredUser,
  saveSession,
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
  }) => Promise<void>;
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

  useEffect(() => {
    const token = getAccessToken();
    const stored = getStoredUser();
    if (token && stored) {
      // Resync cookies for Next middleware after refresh navigations
      saveSession(token, stored);
      setAccessToken(token);
      setUser(stored);
      setLoading(false);
      return;
    }

    api
      .refresh()
      .then((res) => {
        const nextUser = toUser(res);
        saveSession(res.accessToken, nextUser);
        setAccessToken(res.accessToken);
        setUser(nextUser);
      })
      .catch(() => {
        clearSession();
      })
      .finally(() => setLoading(false));
  }, []);

  const applyAuth = useCallback((res: AuthResponse) => {
    const nextUser = toUser(res);
    saveSession(res.accessToken, nextUser);
    setAccessToken(res.accessToken);
    setUser(nextUser);
  }, []);

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
      applyAuth(res);
      router.replace("/dashboard");
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
