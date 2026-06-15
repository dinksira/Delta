import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Hides the floating Next.js dev badge (N in a circle) in development. */
  devIndicators: false,
  /** Static export for production builds only — dev needs dynamic school routes. */
  ...(process.env.NODE_ENV === "production" ? { output: "export" as const } : {}),
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
