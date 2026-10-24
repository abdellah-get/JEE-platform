import type { ClubRole, ProjectRole, ProjectStatus } from "./types";

export const PROJECT_STATUSES: ProjectStatus[] = [
  "BROUILLON",
  "ACTIF",
  "TERMINE",
  "ARCHIVE",
];

export function statusLabel(status: ProjectStatus): string {
  switch (status) {
    case "BROUILLON":
      return "Brouillon";
    case "ACTIF":
      return "Actif";
    case "TERMINE":
      return "Terminé";
    case "ARCHIVE":
      return "Archivé";
  }
}

export function roleLabel(role: ProjectRole | null | undefined): string {
  if (role === "CHEF_PROJET") return "Chef de projet";
  if (role === "CONTRIBUTEUR") return "Contributeur";
  return "—";
}

export function canCreateProject(clubRole: ClubRole): boolean {
  return clubRole === "BUREAU" || clubRole === "ADMIN_TECH";
}

export function canManageProject(
  clubRole: ClubRole,
  myRole: ProjectRole | null | undefined,
): boolean {
  return (
    clubRole === "BUREAU" ||
    clubRole === "ADMIN_TECH" ||
    myRole === "CHEF_PROJET"
  );
}
