import type { Metadata } from "next";
import { brand } from "@/config/brand";
import "./globals.css";

export const metadata: Metadata = {
  title: brand.name,
  description: `${brand.tagline}. The treasurer's records, and each member's own position.`,
  applicationName: brand.name,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
