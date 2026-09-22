import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pocket Jane",
    short_name: "Jane",
    description: "Read anyone. Psychological profiling grounded in the books you upload.",
    start_url: "/analyze",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Matches the light (Jane) theme; the browser chrome picks this up
    background_color: "#ffffff",
    theme_color: "#2d5be3",
    categories: ["productivity", "education"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
