import type { NextConfig } from "next";
import { securityHeaders } from "./lib/http/security-headers";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  serverExternalPackages: ["exceljs"],
  allowedDevOrigins: ["127.0.0.1", "192.168.100.4"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders(isProd) }];
  },
};

export default nextConfig;
