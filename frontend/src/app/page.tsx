import Link from "next/link";

import { ClubLogo } from "@/components/brand/ClubLogo";

export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center gap-8 px-6 py-12 text-ink">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-brand" aria-hidden />
      <ClubLogo size="lg" />
      <div className="max-w-lg space-y-3 text-center">
        <p className="text-xs font-semibold tracking-[0.2em] text-brand">
          JUNIOR-ENTREPRISE
        </p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          ESEM Platform
        </h1>
        <p className="text-base text-muted">
          Suivi des projets, tâches et annonces du club — études et conseils.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/login" className="btn btn-primary min-w-[9rem]">
          Se connecter
        </Link>
        <Link href="/register" className="btn btn-secondary min-w-[9rem]">
          S&apos;inscrire
        </Link>
      </div>
    </main>
  );
}
