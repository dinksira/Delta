import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Hides the floating Next.js dev badge (N in a circle) in development. */
  devIndicators: false,
  output: "export",
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
