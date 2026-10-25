"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { ClubLogo } from "@/components/brand/ClubLogo";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { PageMotion } from "@/components/motion/PageMotion";
import { useAuth } from "@/context/AuthContext";
import { canAccessAdmin } from "@/lib/auth-storage";

const NAV = [
  { href: "/dashboard", label: "Vue d’ensemble" },
  { href: "/projects", label: "Projets" },
  { href: "/tasks", label: "Mes tâches" },
  { href: "/announcements", label: "Annonces" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Mon profil" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navId = useId();
  const showAdmin = canAccessAdmin(user?.clubRole);

  const links = showAdmin
    ? [...NAV, { href: "/admin", label: "Admin" } as const]
    : NAV;

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-dvh text-ink md:flex">
      <a
        href="#contenu-principal"
        className="absolute left-4 top-4 z-50 -translate-y-[200%] rounded-lg bg-brand px-3 py-2 text-sm text-white focus:translate-y-0"
      >
        Aller au contenu
      </a>

      <aside
        id={navId}
        className={`fixed inset-y-0 left-0 z-40 flex w-[min(18rem,88vw)] flex-col border-r border-line bg-surface/95 pt-[env(safe-area-inset-top)] shadow-[8px_0_32px_rgb(61_61_61/6%)] backdrop-blur-md transition-transform duration-300 ease-out md:static md:w-64 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col px-3 py-4">
          <div className="mb-5 flex items-start justify-between gap-2 px-2">
            <Link
              href="/dashboard"
              className="min-w-0 transition-opacity duration-200 hover:opacity-90"
            >
              <ClubLogo size="sm" showWordmark />
            </Link>
            <button
              type="button"
              className="btn btn-secondary px-2 py-1 text-xs md:hidden"
              onClick={() => setOpen(false)}
            >
              Fermer
            </button>
          </div>
          <div className="brand-rule mx-2 mb-4" />

          <nav
            aria-label="Navigation principale"
            className="flex flex-1 flex-col gap-1 overflow-y-auto px-1"
          >
            {links.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="nav-link"
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-line px-2 pt-4 pb-[env(safe-area-inset-bottom)]">
            {user ? (
              <>
                <p className="truncate text-sm font-semibold text-ink">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-muted">{user.email}</p>
                <p className="mt-1 inline-flex rounded-md bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand">
                  {user.clubRole}
                </p>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="btn btn-secondary mt-3 w-full"
                >
                  Déconnexion
                </button>
              </>
            ) : null}
          </div>
        </div>
      </aside>

      {open ? (
        <button
          type="button"
          aria-label="Fermer le menu"
          className="fixed inset-0 z-30 bg-ink/25 backdrop-blur-[1px] md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="glass-bar sticky top-0 z-20 flex items-center gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls={navId}
            className="btn btn-secondary px-3 py-1.5"
          >
            Menu
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">ESEM Platform</p>
          </div>
          <NotificationBell />
        </header>
        <div className="glass-bar hidden items-center justify-between px-8 py-3.5 md:flex">
          <p className="text-sm text-muted">
            Études &amp; conseils · espace membres
          </p>
          <NotificationBell />
        </div>
        <main
          id="contenu-principal"
          className="flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8 md:py-8"
        >
          <PageMotion>{children}</PageMotion>
        </main>
      </div>
    </div>
  );
}
