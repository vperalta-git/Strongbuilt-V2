import type { MetadataRoute } from "next"
import { siteConfig } from "@/config/site"
import { getTrucks } from "@/lib/data/trucks"

export const revalidate = 300

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const trucks = await getTrucks()
  const now = new Date()
  const pages = ["", "/trucks", "/industries", "/services", "/about", "/contact", "/request-a-quote", "/privacy"]

  return [
    ...pages.map((path, index) => ({
      url: new URL(path || "/", siteConfig.url).toString(),
      lastModified: now,
      changeFrequency: (index === 0 ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: index === 0 ? 1 : path === "/trucks" ? 0.9 : 0.7,
    })),
    ...trucks.map((truck) => ({
      url: new URL(`/trucks/${truck.slug}`, siteConfig.url).toString(),
      lastModified: new Date(truck.updatedAt),
      changeFrequency: "monthly" as const,
      priority: 0.8,
      images: truck.images.map((image) => new URL(image.url, siteConfig.url).toString()),
    })),
  ]
}
