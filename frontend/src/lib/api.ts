import {
  clearSession,
  getStoredUser,
  saveSession,
} from "./auth-storage";
import type {
  AdminUser,
  Announcement,
  AppNotification,
  AuthResponse,
  AuthUser,
  ClubRole,
  Dashboard,
  Project,
  ProjectActivity,
  ProjectMember,
  ProjectRole,
  ProjectStatus,
  Task,
  TaskComment,
  TaskPriority,
  TaskStatus,
  UserSummary,
} from "./types";

export type MeResponse = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  clubRole: ClubRole;
  active: boolean;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8081";

type AuthSessionHandlers = {
  onRefreshed?: (res: AuthResponse) => void;
  onCleared?: () => void;
};

let authSessionHandlers: AuthSessionHandlers = {};
let refreshInFlight: Promise<string | null> | null = null;

/** Wired by AuthProvider so silent refresh keeps React state in sync. */
export function setAuthSessionHandlers(handlers: AuthSessionHandlers) {
  authSessionHandlers = handlers;
}

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

function canSilentRefresh(path: string): boolean {
  return !path.startsWith("/api/v1/auth/");
}

function toUser(res: AuthResponse): AuthUser {
  return {
    userId: res.userId,
    email: res.email,
    firstName: res.firstName,
    lastName: res.lastName,
    clubRole: res.clubRole,
  };
}

/**
 * Single-flight refresh via HttpOnly cookie. Updates localStorage + AuthProvider.
 * Returns the new access token, or null if the session is dead.
 */
async function silentRefresh(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
        });
        if (!res.ok) {
          clearSession();
          authSessionHandlers.onCleared?.();
          return null;
        }
        const data = (await res.json()) as AuthResponse;
        const nextUser = toUser(data);
        const stored = getStoredUser();
        saveSession(data.accessToken, stored ?? nextUser);
        authSessionHandlers.onRefreshed?.(data);
        return data.accessToken;
      } catch {
        clearSession();
        authSessionHandlers.onCleared?.();
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string | null,
  retried = false,
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
    if (res.status === 401 && !retried && canSilentRefresh(path)) {
      const newToken = await silentRefresh();
      if (newToken) {
        return apiFetch<T>(path, options, newToken, true);
      }
      throw new ApiError(401, "Session expirée. Reconnecte-toi.");
    }
    throw new ApiError(res.status, await parseError(res));
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export type RegisterResponse = {
  pendingApproval: boolean;
  message: string;
  accessToken: string | null;
  tokenType: string | null;
  expiresInMinutes: number;
  userId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  clubRole: ClubRole | null;
};

export function register(body: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return apiFetch<RegisterResponse>("/api/v1/auth/register", {
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

export function forgotPassword(body: { email: string }) {
  return apiFetch<{ message: string }>("/api/v1/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function resetPassword(body: { token: string; password: string }) {
  return apiFetch<{ message: string }>("/api/v1/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
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

export function listProjects(accessToken: string) {
  return apiFetch<Project[]>("/api/v1/projects", { method: "GET" }, accessToken);
}

export function getProject(accessToken: string, projectId: string) {
  return apiFetch<Project>(
    `/api/v1/projects/${projectId}`,
    { method: "GET" },
    accessToken,
  );
}

export function createProject(
  accessToken: string,
  body: {
    name: string;
    description?: string;
    status?: ProjectStatus;
    chefUserId?: string;
  },
) {
  return apiFetch<Project>(
    "/api/v1/projects",
    { method: "POST", body: JSON.stringify(body) },
    accessToken,
  );
}

export function updateProject(
  accessToken: string,
  projectId: string,
  body: {
    name?: string;
    description?: string;
    status?: ProjectStatus;
  },
) {
  return apiFetch<Project>(
    `/api/v1/projects/${projectId}`,
    { method: "PATCH", body: JSON.stringify(body) },
    accessToken,
  );
}

export function listProjectMembers(accessToken: string, projectId: string) {
  return apiFetch<ProjectMember[]>(
    `/api/v1/projects/${projectId}/members`,
    { method: "GET" },
    accessToken,
  );
}

export function replaceProjectMembers(
  accessToken: string,
  projectId: string,
  members: { userId: string; role: ProjectRole }[],
) {
  return apiFetch<ProjectMember[]>(
    `/api/v1/projects/${projectId}/members`,
    { method: "PUT", body: JSON.stringify({ members }) },
    accessToken,
  );
}

export function listProjectActivity(accessToken: string, projectId: string) {
  return apiFetch<ProjectActivity[]>(
    `/api/v1/projects/${projectId}/activity`,
    { method: "GET" },
    accessToken,
  );
}

export function listUsers(accessToken: string) {
  return apiFetch<UserSummary[]>("/api/v1/users", { method: "GET" }, accessToken);
}

export function listAdminUsers(accessToken: string) {
  return apiFetch<AdminUser[]>("/api/v1/admin/users", { method: "GET" }, accessToken);
}

export function updateUserActive(
  accessToken: string,
  userId: string,
  active: boolean,
) {
  return apiFetch<AdminUser>(
    `/api/v1/admin/users/${userId}/active`,
    { method: "PATCH", body: JSON.stringify({ active }) },
    accessToken,
  );
}

export function updateUserClubRole(
  accessToken: string,
  userId: string,
  clubRole: ClubRole,
) {
  return apiFetch<AdminUser>(
    `/api/v1/admin/users/${userId}/role`,
    { method: "PATCH", body: JSON.stringify({ clubRole }) },
    accessToken,
  );
}

export function listProjectTasks(accessToken: string, projectId: string) {
  return apiFetch<Task[]>(
    `/api/v1/projects/${projectId}/tasks`,
    { method: "GET" },
    accessToken,
  );
}

export function createTask(
  accessToken: string,
  projectId: string,
  body: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    dueDate?: string;
  },
) {
  return apiFetch<Task>(
    `/api/v1/projects/${projectId}/tasks`,
    { method: "POST", body: JSON.stringify(body) },
    accessToken,
  );
}

export function updateTask(
  accessToken: string,
  taskId: string,
  body: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    assigneeId?: string;
    clearAssignee?: boolean;
    dueDate?: string;
    clearDueDate?: boolean;
    sortOrder?: number;
  },
) {
  return apiFetch<Task>(
    `/api/v1/tasks/${taskId}`,
    { method: "PATCH", body: JSON.stringify(body) },
    accessToken,
  );
}

/** Réordonne une colonne Kanban (status + sortOrder = index). */
export function reorderProjectTasks(
  accessToken: string,
  projectId: string,
  body: { status: TaskStatus; taskIds: string[] },
) {
  return apiFetch<Task[]>(
    `/api/v1/projects/${projectId}/tasks/reorder`,
    { method: "PUT", body: JSON.stringify(body) },
    accessToken,
  );
}

export function deleteTask(accessToken: string, taskId: string) {
  return apiFetch<void>(`/api/v1/tasks/${taskId}`, { method: "DELETE" }, accessToken);
}

export function listTaskComments(accessToken: string, taskId: string) {
  return apiFetch<TaskComment[]>(
    `/api/v1/tasks/${taskId}/comments`,
    { method: "GET" },
    accessToken,
  );
}

export function createTaskComment(accessToken: string, taskId: string, body: string) {
  return apiFetch<TaskComment>(
    `/api/v1/tasks/${taskId}/comments`,
    { method: "POST", body: JSON.stringify({ body }) },
    accessToken,
  );
}

export function updateTaskComment(accessToken: string, commentId: string, body: string) {
  return apiFetch<TaskComment>(
    `/api/v1/comments/${commentId}`,
    { method: "PATCH", body: JSON.stringify({ body }) },
    accessToken,
  );
}

export function deleteTaskComment(accessToken: string, commentId: string) {
  return apiFetch<void>(
    `/api/v1/comments/${commentId}`,
    { method: "DELETE" },
    accessToken,
  );
}

export function listMyTasks(
  accessToken: string,
  filters?: {
    status?: TaskStatus;
    priority?: TaskPriority;
    projectId?: string;
  },
) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.projectId) params.set("projectId", filters.projectId);
  const qs = params.toString();
  return apiFetch<Task[]>(
    `/api/v1/me/tasks${qs ? `?${qs}` : ""}`,
    { method: "GET" },
    accessToken,
  );
}

export function listAnnouncements(accessToken: string) {
  return apiFetch<Announcement[]>(
    "/api/v1/announcements",
    { method: "GET" },
    accessToken,
  );
}

export function getAnnouncement(accessToken: string, id: string) {
  return apiFetch<Announcement>(
    `/api/v1/announcements/${id}`,
    { method: "GET" },
    accessToken,
  );
}

export function createAnnouncement(
  accessToken: string,
  body: { title: string; body: string; pinned?: boolean },
) {
  return apiFetch<Announcement>(
    "/api/v1/announcements",
    { method: "POST", body: JSON.stringify(body) },
    accessToken,
  );
}

export function updateAnnouncement(
  accessToken: string,
  id: string,
  body: { title?: string; body?: string; pinned?: boolean },
) {
  return apiFetch<Announcement>(
    `/api/v1/announcements/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
    accessToken,
  );
}

export function deleteAnnouncement(accessToken: string, id: string) {
  return apiFetch<void>(
    `/api/v1/announcements/${id}`,
    { method: "DELETE" },
    accessToken,
  );
}

export function getDashboard(accessToken: string) {
  return apiFetch<Dashboard>("/api/v1/dashboard", { method: "GET" }, accessToken);
}

/** Télécharge l’export CSV bureau (projets + avancement + tâches ouvertes). */
export async function downloadDashboardExportCsv(accessToken: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/dashboard/export.csv`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
    credentials: "include",
  });
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "jee-projects-export.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function listNotifications(accessToken: string, unreadOnly = false) {
  const q = unreadOnly ? "?unreadOnly=true" : "";
  return apiFetch<AppNotification[]>(
    `/api/v1/notifications${q}`,
    { method: "GET" },
    accessToken,
  );
}

export function getUnreadNotificationCount(accessToken: string) {
  return apiFetch<{ count: number }>(
    "/api/v1/notifications/unread-count",
    { method: "GET" },
    accessToken,
  );
}

export function markNotificationRead(accessToken: string, id: string) {
  return apiFetch<AppNotification>(
    `/api/v1/notifications/${id}/read`,
    { method: "POST" },
    accessToken,
  );
}

export function markAllNotificationsRead(accessToken: string) {
  return apiFetch<{ updated: number }>(
    "/api/v1/notifications/read-all",
    { method: "POST" },
    accessToken,
  );
}
