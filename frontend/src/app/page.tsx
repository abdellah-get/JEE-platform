import Link from "next/link";

import { ClubLogo } from "@/components/brand/ClubLogo";

export default function Home() {
  return (
    <main className="relative min-h-dvh overflow-hidden text-ink">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,rgb(139_35_50/14%),transparent_55%),radial-gradient(ellipse_at_90%_80%,rgb(61_61_61/8%),transparent_50%)]"
        aria-hidden
      />
      <div className="absolute inset-x-0 top-0 h-1.5 bg-brand" aria-hidden />

      <section className="relative mx-auto flex min-h-dvh max-w-3xl flex-col items-center justify-center px-6 py-16 text-center">
        <div className="auth-enter flex flex-col items-center gap-7">
          <ClubLogo size="lg" showWordmark />
          <h1 className="display-hero max-w-xl text-4xl sm:text-5xl md:text-[3.4rem]">
            Junior Entreprise
            <br />
            ENSEM
          </h1>
          <p className="max-w-md text-[1.05rem] leading-relaxed text-muted">
            Une seule plateforme pour piloter les missions, les livrables et la
            vie du club — claire, mobile, et faite pour l’équipe.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <Link href="/login" className="btn btn-primary min-w-[10.5rem]">
              Se connecter
            </Link>
            <Link href="/register" className="btn btn-secondary min-w-[10.5rem]">
              Demander l’accès
            </Link>
          </div>
        </div>
      </section>

      <section className="relative border-t border-line bg-surface/70 px-6 py-14 backdrop-blur-sm">
        <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-3">
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight">
              Missions
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Projets, équipe, Kanban et pièces jointes au même endroit.
            </p>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight">
              Planning
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Événements, RSVP et calendrier semaine / agenda pour le bureau.
            </p>
          </div>
          <div>
            <h2 className="font-[family-name:var(--font-syne)] text-lg font-semibold tracking-tight">
              Club
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Annonces, notifications et validation des nouvelles adhésions.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
