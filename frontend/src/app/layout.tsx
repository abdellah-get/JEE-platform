import type { Metadata } from "next";
import localFont from "next/font/local";

import { Providers } from "./providers";
import "./globals.css";

/** Self-hosted so CI/Vercel builds do not fetch Google Fonts (flaky next/font). */
const manrope = localFont({
  src: "../fonts/manrope-latin-wght-normal.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

const syne = localFont({
  src: "../fonts/syne-latin-wght-normal.woff2",
  variable: "--font-syne",
  weight: "400 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ENSEM Platform — Junior-Entreprise",
  description:
    "Pilote projets, tâches et annonces de ENSEM Engineering Junior-Entreprise.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${manrope.variable} ${syne.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
