import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

  return [
    "",
    "/services",
    "/sign-in",
    "/sign-up",
    "/dashboard",
    "/chat",
    "/alerts",
    "/analyst",
    "/reports",
    "/settings",
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: path === "" ? 1 : 0.7,
  }));
}
