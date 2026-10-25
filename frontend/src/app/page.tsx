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
        <div className="max-w-lg space-y-3 text-center">
          <p className="section-label">Junior-Entreprise</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            ESEM Platform
          </h1>
          <p className="text-base leading-relaxed text-muted">
            Suivi des projets, tâches et annonces du club — études et conseils.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login" className="btn btn-primary min-w-[10rem]">
            Se connecter
          </Link>
          <Link href="/register" className="btn btn-secondary min-w-[10rem]">
            S&apos;inscrire
          </Link>
        </div>
      </div>
    </main>
  );
}
