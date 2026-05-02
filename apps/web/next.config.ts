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
  // Workspace packages (e.g. @dealership/types) are authored as .ts but use
  // explicit .js extensions on relative imports so they remain valid
  // ECMAScript under apps/api's NodeNext module resolution. Webpack does not
  // map .js → .ts by default, so we wire that here.
  webpack: (cfg) => {
    cfg.resolve = cfg.resolve ?? {};
    cfg.resolve.extensionAlias = {
      ...(cfg.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js", ".jsx"],
      ".mjs": [".mts", ".mjs"],
    };
    return cfg;
  },
};

export default config;
