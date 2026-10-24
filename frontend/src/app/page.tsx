import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-zinc-50 text-zinc-900">
      <p className="text-sm uppercase tracking-[0.2em] text-zinc-500">
        Junior Entreprise ENSEM
      </p>
      <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-center">
        JEE Platform
      </h1>
      <p className="max-w-md text-center text-zinc-600">
        Plateforme d&apos;avancement de projets, tâches et annonces du club.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Se connecter
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium hover:bg-zinc-100"
        >
          S&apos;inscrire
        </Link>
      </div>
    </main>
  );
}
