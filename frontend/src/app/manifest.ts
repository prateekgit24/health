import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HOW | Health Over Wealth",
    short_name: "HOW",
    description:
      "Health and fitness platform for profile planning, nutrition insights, activity tracking, calculators, and progress comparison.",
    start_url: "/",
    display: "standalone",
    background_color: "#010b08",
    theme_color: "#22c55e",
    icons: [
      {
        src: "/images/howlogo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/images/howlogo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
