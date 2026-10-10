import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Plain static site: `next build` writes HTML/CSS/assets to `out/`.
  output: "export",
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
