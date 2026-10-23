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
        Monorepo initialisé — mission P0 en cours.
      </p>
      <code className="rounded-md bg-zinc-200/80 px-3 py-1.5 text-sm font-mono">
        frontend · Next.js 15 · prêt
      </code>
    </main>
  );
}
