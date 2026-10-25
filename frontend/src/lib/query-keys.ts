export const queryKeys = {
  dashboard: ["dashboard"] as const,
  projects: (page = 0) => ["projects", { page }] as const,
  myTasks: (filters: {
    status?: string;
    priority?: string;
    projectId?: string;
    page?: number;
  }) => ["my-tasks", filters] as const,
  notifications: (unreadOnly = false, page = 0) =>
    ["notifications", { unreadOnly, page }] as const,
  unreadNotificationCount: ["notifications", "unread-count"] as const,
};
