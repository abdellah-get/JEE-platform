export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-50 px-4 py-10 text-zinc-900">
      <div className="w-full max-w-md">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.2em] text-zinc-500">
          Junior Entreprise ENSEM
        </p>
        <h1 className="mb-1 text-center text-3xl font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mb-8 text-center text-sm text-zinc-600">{subtitle}</p>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          {children}
        </div>
      </div>
    </main>
  );
}
