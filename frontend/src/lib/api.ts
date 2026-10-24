import type { AuthResponse, AuthUser, ClubRole } from "./types";

export type MeResponse = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  clubRole: ClubRole;
  active: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function parseError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? `Erreur ${res.status}`;
  } catch {
    return `Erreur ${res.status}`;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export function register(body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return apiFetch<AuthResponse>("/api/v1/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function login(body: { email: string; password: string }) {
  return apiFetch<AuthResponse>("/api/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function refresh() {
  return apiFetch<AuthResponse>("/api/v1/auth/refresh", { method: "POST" });
}

export function logout() {
  return apiFetch<void>("/api/v1/auth/logout", { method: "POST" });
}

export function getMe(accessToken: string) {
  return apiFetch<MeResponse>("/api/v1/me", { method: "GET" }, accessToken);
}

export function updateMe(
  accessToken: string,
  body: { firstName: string; lastName: string },
) {
  return apiFetch<MeResponse>(
    "/api/v1/me",
    { method: "PATCH", body: JSON.stringify(body) },
    accessToken,
  );
}

export function changePassword(
  accessToken: string,
  body: { currentPassword: string; newPassword: string },
) {
  return apiFetch<void>(
    "/api/v1/me/password",
    { method: "POST", body: JSON.stringify(body) },
    accessToken,
  );
}

export function meToAuthUser(me: MeResponse): AuthUser {
  return {
    userId: me.userId,
    email: me.email,
    firstName: me.firstName,
    lastName: me.lastName,
    clubRole: me.clubRole,
  };
}
