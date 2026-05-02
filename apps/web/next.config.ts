import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@dealership/ui", "@dealership/types", "@dealership/db"],
  images: {
    remotePatterns: [
      // Cloudflare R2 (custom domain or default endpoint).
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      // Cloudinary CDN.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Unsplash — used for placeholder imagery on the homepage.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  typedRoutes: true,
};

export default config;
