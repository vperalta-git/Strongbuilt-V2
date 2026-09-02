import type { Db } from "mongodb"
import { getSiteSettingsCollection } from "@/lib/db/collections"
import type { SiteSettingsSeed } from "@/lib/validation/database"
import type { SeedReport } from "@/scripts/seed-helpers"

export async function seedSiteSettings(db: Db, seed: SiteSettingsSeed, timestamp: Date): Promise<SeedReport> {
  const collection = getSiteSettingsCollection(db)
  const { _id, ...settings } = seed
  const result = await collection.updateOne(
    { _id },
    { $set: { ...settings, updatedAt: timestamp } },
    { upsert: true },
  )
  return { count: 1, inserted: result.upsertedCount, updated: result.modifiedCount }
}
