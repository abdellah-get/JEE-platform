export type ClubRole = "MEMBRE" | "BUREAU" | "ADMIN_TECH";

export type ProjectStatus = "BROUILLON" | "ACTIF" | "TERMINE" | "ARCHIVE";

export type ProjectRole = "CHEF_PROJET" | "CONTRIBUTEUR";

export type AuthUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  clubRole: ClubRole;
};

export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  progressPercent: number;
  createdBy: string;
  myRole: ProjectRole | null;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  projectName: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  sortOrder: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type TaskComment = {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationType =
  | "TASK_ASSIGNED"
  | "ANNOUNCEMENT_PINNED"
  | "EVENT_PINNED";

export type AppNotification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export type ProjectMember = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: ProjectRole;
  joinedAt: string;
};

export type ProjectActivityType =
  | "TASK_CREATED"
  | "TASK_STATUS_CHANGED"
  | "TASK_DELETED"
  | "MEMBER_ADDED"
  | "MEMBER_REMOVED";

export type ProjectActivity = {
  id: string;
  projectId: string;
  actorUserId: string;
  actorName: string;
  type: ProjectActivityType;
  message: string;
  taskId: string | null;
  createdAt: string;
};

export type ProjectAttachment = {
  id: string;
  projectId: string;
  taskId: string | null;
  uploadedById: string;
  uploadedByName: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  createdAt: string;
};

export type UserSummary = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  clubRole: ClubRole;
};

export type AdminUser = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  clubRole: ClubRole;
  active: boolean;
  membershipStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type ClubEvent = {
  id: string;
  title: string;
  description: string;
  location: string | null;
  startsAt: string;
  endsAt: string | null;
  pinned: boolean;
  createdById: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarItemType = "EVENT" | "TASK_DUE";

export type CalendarItem = {
  type: CalendarItemType;
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  link: string;
  pinned: boolean;
  meta: string | null;
};

export type DashboardKpis = {
  activeMembers: number;
  totalProjects: number;
  activeProjects: number;
  openTasks: number;
  pinnedAnnouncements: number;
  projectsBrouillon: number;
  projectsActif: number;
  projectsTermine: number;
  projectsArchive: number;
  averageProgressPercent: number;
  overdueTasks: number;
};

export type Dashboard = {
  clubRole: ClubRole;
  pinnedAnnouncements: Announcement[];
  myProjects: Project[];
  myTasks: Task[];
  kpis?: DashboardKpis | null;
};

export type AuthResponse = {
  accessToken: string;
  tokenType: string;
  expiresInMinutes: number;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  clubRole: ClubRole;
};
