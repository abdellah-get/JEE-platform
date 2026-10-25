"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";

import { NotificationBell } from "@/components/layout/NotificationBell";
import { useAuth } from "@/context/AuthContext";
import { canAccessAdmin } from "@/lib/auth-storage";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projets" },
  { href: "/tasks", label: "Mes tâches" },
  { href: "/announcements", label: "Annonces" },
  { href: "/notifications", label: "Notifications" },
  { href: "/profile", label: "Profil" },
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
    <div className="min-h-dvh bg-zinc-50 text-zinc-900 md:flex">
      <a
        href="#contenu-principal"
        className="absolute left-4 top-4 z-50 -translate-y-[200%] rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white focus:translate-y-0"
      >
        Aller au contenu
      </a>

      <aside
        id={navId}
        className={`fixed inset-y-0 left-0 z-40 w-[min(18rem,85vw)] border-r border-zinc-200 bg-white pt-[env(safe-area-inset-top)] transition-transform duration-200 md:static md:w-64 md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-8 flex items-start justify-between gap-2 px-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                JEE ENSEM
              </p>
              <p className="text-lg font-semibold tracking-tight">Platform</p>
            </div>
            <button
              type="button"
              className="rounded-lg border border-zinc-300 px-2 py-1 text-xs md:hidden"
              onClick={() => setOpen(false)}
            >
              Fermer
            </button>
          </div>

          <nav aria-label="Navigation principale" className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {links.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-zinc-100 px-2 pt-4 pb-[env(safe-area-inset-bottom)]">
            {user ? (
              <>
                <p className="truncate text-sm font-medium">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
                <p className="mt-1 text-xs text-zinc-500">{user.clubRole}</p>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100"
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
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <div className="flex min-h-dvh flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur pt-[max(0.75rem,env(safe-area-inset-top))] md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls={navId}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            Menu
          </button>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">JEE Platform</span>
          <NotificationBell />
        </header>
        <div className="hidden items-center justify-end border-b border-zinc-200 bg-white px-8 py-3 md:flex">
          <NotificationBell />
        </div>
        <main
          id="contenu-principal"
          className="flex-1 px-4 py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
