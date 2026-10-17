import type { MetadataRoute } from "next";
import { brand } from "@/config/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${brand.name} — ${brand.tagline}`,
    short_name: brand.name,
    description: brand.tagline,
    start_url: "/",
    display: "standalone",
    background_color: brand.colors.ivory,
    theme_color: brand.colors.ink,
    icons: [{ src: brand.logoPath, sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
