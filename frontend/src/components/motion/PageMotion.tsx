"use client";

import { usePathname } from "next/navigation";

/** One orchestrated enter per route — respects prefers-reduced-motion via CSS. */
export function PageMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  );
}
