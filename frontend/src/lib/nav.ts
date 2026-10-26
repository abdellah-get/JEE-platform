/** Primary app nav — short hints make destinations understandable at a glance. */
export const APP_NAV = [
  {
    href: "/dashboard",
    label: "Vue d’ensemble",
    hint: "Priorités du jour",
  },
  {
    href: "/projects",
    label: "Projets",
    hint: "Missions & livrables",
  },
  {
    href: "/tasks",
    label: "Mes tâches",
    hint: "Ce qui t’attend",
  },
  {
    href: "/announcements",
    label: "Annonces",
    hint: "Infos du bureau",
  },
  {
    href: "/events",
    label: "Événements",
    hint: "AG & formations",
  },
  {
    href: "/calendar",
    label: "Calendrier",
    hint: "Vue mois",
  },
  {
    href: "/notifications",
    label: "Notifications",
    hint: "Alertes récentes",
  },
  {
    href: "/profile",
    label: "Mon profil",
    hint: "Compte & sécurité",
  },
] as const;

export const ADMIN_NAV = {
  href: "/admin",
  label: "Admin",
  hint: "Membres & rôles",
} as const;

export function navContext(pathname: string): { label: string; hint: string } {
  const all = [...APP_NAV, ADMIN_NAV];
  const hit =
    all.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ??
    APP_NAV[0];
  return { label: hit.label, hint: hit.hint };
}
