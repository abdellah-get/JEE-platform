export const queryKeys = {
  dashboard: ["dashboard"] as const,
  projects: (page = 0) => ["projects", { page }] as const,
  project: (id: string) => ["projects", id] as const,
  projectMembers: (id: string) => ["projects", id, "members"] as const,
  projectActivity: (id: string) => ["projects", id, "activity"] as const,
  projectAttachments: (id: string) => ["projects", id, "attachments"] as const,
  projectTasks: (id: string) => ["projects", id, "tasks"] as const,
  taskComments: (taskId: string) => ["tasks", taskId, "comments"] as const,
  myTasks: (filters: {
    status?: string;
    priority?: string;
    projectId?: string;
    page?: number;
  }) => ["my-tasks", filters] as const,
  announcements: (page = 0) => ["announcements", { page }] as const,
  announcement: (id: string) => ["announcements", id] as const,
  events: (page = 0) => ["events", { page }] as const,
  event: (id: string) => ["events", id] as const,
  calendar: (from: string, to: string) => ["calendar", { from, to }] as const,
  notifications: (unreadOnly = false, page = 0) =>
    ["notifications", { unreadOnly, page }] as const,
  unreadNotificationCount: ["notifications", "unread-count"] as const,
  adminUsers: (page = 0, membership?: string) =>
    ["admin-users", { page, membership }] as const,
  usersDirectory: ["users"] as const,
  search: (q: string) => ["search", { q }] as const,
};
