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

const themeBoot = `(function(){try{var k="jee_theme";var t=localStorage.getItem(k);if(t!=="dark"&&t!=="light"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.dataset.theme=t;}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${manrope.variable} ${syne.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
