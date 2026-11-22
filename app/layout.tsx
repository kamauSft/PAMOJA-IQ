import type { Metadata } from "next";
import { headers } from "next/headers";
import { brand } from "@/config/brand";
import { DevCleanup } from "@/components/dev-cleanup";
import { ThemeBoot } from "@/components/theme-boot";
import { getLocale } from "@/lib/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: brand.name,
  description: `${brand.tagline}. The treasurer's records, and each member's own position.`,
  applicationName: brand.name,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang={locale}>
      <body className="font-sans antialiased">
        <ThemeBoot nonce={nonce} />
        {process.env.NODE_ENV === "development" ? <DevCleanup /> : null}
        {children}
      </body>
    </html>
  );
}
