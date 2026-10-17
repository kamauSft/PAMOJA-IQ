import type { Metadata } from "next";
import { Bricolage_Grotesque, Figtree, JetBrains_Mono } from "next/font/google";
import { brand } from "@/config/brand";
import { getLocale } from "@/lib/locale";
import { ThemeBoot } from "@/components/theme-boot";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-display" });
const body = Figtree({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: brand.name,
  description: `${brand.tagline}. The treasurer's records, and each member's own position.`,
  applicationName: brand.name,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-sans antialiased">
        <ThemeBoot />
        {children}
      </body>
    </html>
  );
}
