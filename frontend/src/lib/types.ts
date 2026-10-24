export type ClubRole = "MEMBRE" | "BUREAU" | "ADMIN_TECH";

export type AuthUser = {
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
