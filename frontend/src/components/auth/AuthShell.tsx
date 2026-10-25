import { ClubLogo } from "@/components/brand/ClubLogo";

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
    <main className="relative flex min-h-dvh items-center justify-center px-4 py-10 text-ink">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-brand" aria-hidden />
      <div className="auth-enter w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="rounded-2xl bg-surface/70 p-3 shadow-[var(--shadow-soft)] ring-1 ring-line backdrop-blur-sm">
            <ClubLogo size="lg" />
          </div>
          <p className="mt-5 text-xs font-bold tracking-[0.2em] text-brand">
            ESEM ENGINEERING
          </p>
          <h1 className="mt-2 page-title text-[1.8rem]">{title}</h1>
          <p className="page-subtitle max-w-sm">{subtitle}</p>
        </div>
        <div className="surface p-6 sm:p-8">{children}</div>
      </div>
    </main>
  );
}
