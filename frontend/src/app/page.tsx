import Link from "next/link";

import { ClubLogo } from "@/components/brand/ClubLogo";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-9 overflow-hidden px-6 py-14 text-ink">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-brand" aria-hidden />
      <div
        className="pointer-events-none absolute -left-24 top-24 h-64 w-64 rounded-full bg-brand/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-20 h-56 w-56 rounded-full bg-brand/8 blur-3xl"
        aria-hidden
      />

      <div className="auth-enter flex flex-col items-center gap-8">
        <div className="rounded-3xl bg-surface/80 p-4 shadow-[var(--shadow-soft)] ring-1 ring-line backdrop-blur-md">
          <ClubLogo size="lg" />
        </div>
        <div className="max-w-xl space-y-4 text-center">
          <p className="section-label">ENSEM Engineering</p>
          <h1 className="display-hero text-4xl sm:text-5xl md:text-[3.35rem]">
            La plateforme
            <br />
            du club
          </h1>
          <p className="mx-auto max-w-md text-[1.02rem] leading-relaxed text-muted">
            Suis les projets, tes tâches, les annonces et le calendrier — au
            rythme d&apos;une Junior-Entreprise.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="btn btn-primary min-w-[10.5rem]">
            Se connecter
          </Link>
          <Link href="/register" className="btn btn-secondary min-w-[10.5rem]">
            Créer un compte
          </Link>
        </div>
        <ul className="stagger-list mt-2 flex flex-wrap justify-center gap-2 text-center text-xs text-muted">
          <li className="rounded-full border border-line bg-surface/70 px-3 py-1.5">
            Projets &amp; livrables
          </li>
          <li className="rounded-full border border-line bg-surface/70 px-3 py-1.5">
            Tâches assignées
          </li>
          <li className="rounded-full border border-line bg-surface/70 px-3 py-1.5">
            Événements &amp; calendrier
          </li>
        </ul>
      </div>
    </main>
  );
}
