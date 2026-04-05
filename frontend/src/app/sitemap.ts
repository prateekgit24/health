import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://how.cosmics.software";
  const now = new Date();

  return [
    "",
    "/profile",
    "/friends",
    "/nutrition",
    "/activities",
    "/calculators",
    "/routines",
    "/insights",
    "/about",
    "/contact",
    "/faq",
    "/help",
    "/privacy-policy",
    "/terms-and-conditions",
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: path === "" ? ("daily" as const) : ("weekly" as const),
    priority:
      path === ""
        ? 1
        : path === "/profile" || path === "/friends" || path === "/nutrition"
          ? 0.9
          : 0.7,
  }));
}
