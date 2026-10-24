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

export type ProjectMember = {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: ProjectRole;
  joinedAt: string;
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

export type DashboardKpis = {
  activeMembers: number;
  totalProjects: number;
  activeProjects: number;
  openTasks: number;
  pinnedAnnouncements: number;
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
