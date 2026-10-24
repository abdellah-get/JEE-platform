"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { canAccessAdmin } from "@/lib/auth-storage";

const NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/projects", label: "Projets" },
  { href: "/tasks", label: "Mes tâches" },
  { href: "/announcements", label: "Annonces" },
  { href: "/profile", label: "Profil" },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const showAdmin = canAccessAdmin(user?.clubRole);

  const links = showAdmin
    ? [...NAV, { href: "/admin", label: "Admin" } as const]
    : NAV;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 md:flex">
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-200 bg-white transition-transform md:static md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col px-4 py-5">
          <div className="mb-8 px-2">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              JEE ENSEM
            </p>
            <p className="text-lg font-semibold tracking-tight">Platform</p>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {links.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
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

          <div className="mt-4 border-t border-zinc-100 pt-4 px-2">
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
                  className="mt-3 w-full rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100"
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

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm"
          >
            Menu
          </button>
          <span className="text-sm font-medium">JEE Platform</span>
        </header>
        <main className="flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
    </div>
  );
}
