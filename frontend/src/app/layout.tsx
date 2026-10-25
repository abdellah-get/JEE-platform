import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ESEM Platform — Junior-Entreprise",
  description:
    "Plateforme d'avancement de projets de ESEM Engineering Junior-Entreprise",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${manrope.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
