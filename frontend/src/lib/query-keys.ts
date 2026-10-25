export const queryKeys = {
  dashboard: ["dashboard"] as const,
  projects: ["projects"] as const,
  myTasks: (filters: {
    status?: string;
    priority?: string;
    projectId?: string;
  }) => ["my-tasks", filters] as const,
  notifications: (unreadOnly = false) =>
    ["notifications", { unreadOnly }] as const,
  unreadNotificationCount: ["notifications", "unread-count"] as const,
};
