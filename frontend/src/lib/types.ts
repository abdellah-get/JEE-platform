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

export type Project = {
  id: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  createdBy: string;
  myRole: ProjectRole | null;
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
