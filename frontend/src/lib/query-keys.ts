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
  auditEvents: (filters: {
    page?: number;
    action?: string;
    from?: string;
    to?: string;
  }) => ["audit-events", filters] as const,
  usersDirectory: ["users"] as const,
  search: (q: string) => ["search", { q }] as const,
  workload: (filters: { projectId?: string; priority?: string }) =>
    ["workload", filters] as const,
  crmLeads: (page = 0, status?: string) =>
    ["crm-leads", { page, status }] as const,
  crmMissions: (page = 0, status?: string) =>
    ["crm-missions", { page, status }] as const,
  crmMission: (id: string) => ["crm-missions", id] as const,
  financeSummary: ["finance-summary"] as const,
  financeExpenses: (page = 0, status?: string) =>
    ["finance-expenses", { page, status }] as const,
  projectBudget: (id: string) => ["projects", id, "budget"] as const,
  projectExpenses: (id: string) => ["projects", id, "expenses"] as const,
};
