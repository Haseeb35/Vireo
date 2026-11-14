import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Failed navigations / server actions wait and retry instead of erroring
    // when the connection drops; powers the useOffline() banner.
    useOffline: true,
  },
  images: {
    // Posters and backdrops are served by TMDB's image CDN.
    remotePatterns: [
      { protocol: "https", hostname: "image.tmdb.org", pathname: "/t/p/**" },
    ],
  },
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
