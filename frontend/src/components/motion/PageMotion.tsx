"use client";

import { usePathname } from "next/navigation";

/**
 * One orchestrated enter per route.
 * CSS-only (no animation library) — compositor-friendly + prefers-reduced-motion.
 */
export function PageMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
