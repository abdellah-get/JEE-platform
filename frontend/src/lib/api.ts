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
  CalendarItem,
  ClubEvent,
  ClubRole,
  Dashboard,
  PageResponse,
  Project,
  ProjectActivity,
  ProjectAttachment,
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

/** Required on cookie-auth endpoints (refresh/logout) — triggers CORS preflight, blocks CSRF. */
const CSRF_HEADER = { "X-Requested-With": "XMLHttpRequest" } as const;

type AuthSessionHandlers = {
  onRefreshed?: (res: AuthResponse) => void;
  onCleared?: () => void;
};

let authSessionHandlers: AuthSessionHandlers = {};

type RefreshResult =
  | { status: "ok"; data: AuthResponse }
  | { status: "expired" }
  | { status: "transient"; message: string };

let refreshInFlight: Promise<RefreshResult> | null = null;

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

function forceLogout() {
  clearSession();
  authSessionHandlers.onCleared?.();
}

/**
 * Single-flight refresh via HttpOnly cookie. Puts access JWT in memory + AuthProvider.
 * Only 401/403 mean the session is dead — 429/5xx/network stay "transient" (no logout).
 */
async function silentRefresh(): Promise<RefreshResult> {
  if (!refreshInFlight) {
    refreshInFlight = (async (): Promise<RefreshResult> => {
      try {
        const res = await fetch(`${API_URL}/api/v1/auth/refresh`, {
          method: "POST",
          credentials: "include",
          headers: CSRF_HEADER,
        });
        if (res.status === 401 || res.status === 403) {
          return { status: "expired" };
        }
        if (!res.ok) {
          return {
            status: "transient",
            message: await parseError(res),
          };
        }
        const data = (await res.json()) as AuthResponse;
        const nextUser = toUser(data);
        const stored = getStoredUser();
        saveSession(data.accessToken, stored ?? nextUser);
        authSessionHandlers.onRefreshed?.(data);
        return { status: "ok", data };
      } catch {
        return {
          status: "transient",
          message: "Réseau indisponible. Réessaie dans un instant.",
        };
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
    // 401 = access JWT dead. One silent refresh; logout only if refresh says session expired.
    if (res.status === 401 && canSilentRefresh(path)) {
      if (!retried) {
        const refreshed = await silentRefresh();
        if (refreshed.status === "ok") {
          return apiFetch<T>(path, options, refreshed.data.accessToken, true);
        }
        if (refreshed.status === "transient") {
          throw new ApiError(503, refreshed.message);
        }
      }
      forceLogout();
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

export async function refresh() {
  const refreshed = await silentRefresh();
  if (refreshed.status === "ok") {
    return refreshed.data;
  }
  if (refreshed.status === "expired") {
    throw new ApiError(401, "Session expirée. Reconnecte-toi.");
  }
  throw new ApiError(503, refreshed.message);
}

export function logout() {
  return apiFetch<void>("/api/v1/auth/logout", {
    method: "POST",
    headers: CSRF_HEADER,
  });
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

export function listProjects(
  accessToken: string,
  page = 0,
  size = 20,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiFetch<PageResponse<Project>>(
    `/api/v1/projects?${params}`,
    { method: "GET" },
    accessToken,
  );
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

export function listProjectAttachments(accessToken: string, projectId: string) {
  return apiFetch<ProjectAttachment[]>(
    `/api/v1/projects/${projectId}/attachments`,
    { method: "GET" },
    accessToken,
  );
}

export async function uploadProjectAttachment(
  accessToken: string,
  projectId: string,
  file: File,
  taskId?: string,
) {
  const form = new FormData();
  form.append("file", file);
  if (taskId) form.append("taskId", taskId);

  const res = await fetch(
    `${API_URL}/api/v1/projects/${projectId}/attachments`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
      body: form,
    },
  );
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  return (await res.json()) as ProjectAttachment;
}

export async function downloadProjectAttachment(
  accessToken: string,
  projectId: string,
  attachmentId: string,
  fileName: string,
) {
  const res = await fetch(
    `${API_URL}/api/v1/projects/${projectId}/attachments/${attachmentId}/download`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
      credentials: "include",
    },
  );
  if (!res.ok) {
    throw new ApiError(res.status, await parseError(res));
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function deleteProjectAttachment(
  accessToken: string,
  projectId: string,
  attachmentId: string,
) {
  return apiFetch<void>(
    `/api/v1/projects/${projectId}/attachments/${attachmentId}`,
    { method: "DELETE" },
    accessToken,
  );
}

export function listUsers(accessToken: string) {
  return apiFetch<UserSummary[]>("/api/v1/users", { method: "GET" }, accessToken);
}

export function listAdminUsers(
  accessToken: string,
  page = 0,
  size = 20,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiFetch<PageResponse<AdminUser>>(
    `/api/v1/admin/users?${params}`,
    { method: "GET" },
    accessToken,
  );
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
    page?: number;
    size?: number;
  },
) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.projectId) params.set("projectId", filters.projectId);
  params.set("page", String(filters?.page ?? 0));
  params.set("size", String(filters?.size ?? 20));
  return apiFetch<PageResponse<Task>>(
    `/api/v1/me/tasks?${params}`,
    { method: "GET" },
    accessToken,
  );
}

export function listAnnouncements(
  accessToken: string,
  page = 0,
  size = 20,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiFetch<PageResponse<Announcement>>(
    `/api/v1/announcements?${params}`,
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

export function listEvents(
  accessToken: string,
  page = 0,
  size = 20,
) {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiFetch<PageResponse<ClubEvent>>(
    `/api/v1/events?${params}`,
    { method: "GET" },
    accessToken,
  );
}

export function getEvent(accessToken: string, id: string) {
  return apiFetch<ClubEvent>(
    `/api/v1/events/${id}`,
    { method: "GET" },
    accessToken,
  );
}

export function createEvent(
  accessToken: string,
  body: {
    title: string;
    description: string;
    location?: string;
    startsAt: string;
    endsAt?: string | null;
    pinned?: boolean;
  },
) {
  return apiFetch<ClubEvent>(
    "/api/v1/events",
    { method: "POST", body: JSON.stringify(body) },
    accessToken,
  );
}

export function updateEvent(
  accessToken: string,
  id: string,
  body: {
    title?: string;
    description?: string;
    location?: string | null;
    startsAt?: string;
    endsAt?: string | null;
    clearEndsAt?: boolean;
    pinned?: boolean;
  },
) {
  return apiFetch<ClubEvent>(
    `/api/v1/events/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
    accessToken,
  );
}

export function deleteEvent(accessToken: string, id: string) {
  return apiFetch<void>(
    `/api/v1/events/${id}`,
    { method: "DELETE" },
    accessToken,
  );
}

export function getCalendar(
  accessToken: string,
  from: string,
  to: string,
) {
  const params = new URLSearchParams({ from, to });
  return apiFetch<CalendarItem[]>(
    `/api/v1/calendar?${params}`,
    { method: "GET" },
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

export function listNotifications(
  accessToken: string,
  unreadOnly = false,
  page = 0,
  size = 20,
) {
  const params = new URLSearchParams({
    unreadOnly: String(unreadOnly),
    page: String(page),
    size: String(size),
  });
  return apiFetch<PageResponse<AppNotification>>(
    `/api/v1/notifications?${params}`,
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
