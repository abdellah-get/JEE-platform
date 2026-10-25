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
      <div className="absolute inset-x-0 top-0 h-1 bg-brand" aria-hidden />
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <ClubLogo size="lg" />
          <p className="mt-4 text-xs font-semibold tracking-[0.18em] text-brand">
            ESEM ENGINEERING
          </p>
          <h1 className="mt-2 page-title text-[1.75rem]">{title}</h1>
          <p className="page-subtitle max-w-sm">{subtitle}</p>
        </div>
        <div className="surface p-6 sm:p-7">{children}</div>
      </div>
    </main>
  );
}
