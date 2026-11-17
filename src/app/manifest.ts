import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ameen | أمين",
    short_name: "Ameen",
    description: "منشأتك في أيدٍ أمينة",
    start_url: "/login",
    display: "standalone",
    background_color: "#F7F5F0",
    theme_color: "#4E7A6E",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/ameen-app-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
