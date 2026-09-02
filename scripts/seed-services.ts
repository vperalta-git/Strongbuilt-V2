import type { Db } from "mongodb"
import { getServicesCollection } from "@/lib/db/collections"
import type { ServiceSeed } from "@/lib/validation/database"
import { syncBySlug, type SeedReport } from "@/scripts/seed-helpers"

export async function seedServices(db: Db, seeds: ServiceSeed[], timestamp: Date): Promise<SeedReport> {
  const collection = getServicesCollection(db)
  await collection.createIndex({ slug: 1 }, { unique: true, name: "services_slug_unique" })
  return syncBySlug(collection, seeds, timestamp)
}
