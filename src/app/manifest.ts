import type { MetadataRoute } from "next";

// Web app manifest: lets browsers install Vireo as an app (home screen / dock).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vireo",
    short_name: "Vireo",
    description: "Films and series, lit by whatever you're watching.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#07080a",
    theme_color: "#07080a",
    categories: ["entertainment", "video"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Search", url: "/search", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My List", url: "/my-list", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
