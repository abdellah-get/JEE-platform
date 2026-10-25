import Image from "next/image";

type ClubLogoProps = {
  /** Compact for sidebar / mobile header */
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  className?: string;
};

const SIZES = {
  sm: { w: 36, h: 36 },
  md: { w: 48, h: 48 },
  lg: { w: 72, h: 72 },
} as const;

export function ClubLogo({
  size = "md",
  showWordmark = false,
  className = "",
}: ClubLogoProps) {
  const dim = SIZES[size];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Image
        src="/esem-logo.png"
        alt="ESEM Engineering Junior-Entreprise"
        width={dim.w}
        height={dim.h}
        className="h-auto w-auto object-contain"
        priority
      />
      {showWordmark ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-ink">
            ESEM Engineering
          </p>
          <p className="truncate text-xs text-muted">Junior-Entreprise</p>
        </div>
      ) : null}
    </div>
  );
}
