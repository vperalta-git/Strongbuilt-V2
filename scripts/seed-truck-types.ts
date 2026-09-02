import type { Db, ObjectId } from "mongodb"
import { getTruckTypesCollection } from "@/lib/db/collections"
import type { TruckTypeSeed } from "@/lib/validation/database"
import { syncBySlug, type SeedReport } from "@/scripts/seed-helpers"

export async function seedTruckTypes(db: Db, seeds: TruckTypeSeed[], timestamp: Date): Promise<SeedReport & { ids: Map<string, ObjectId> }> {
  const collection = getTruckTypesCollection(db)
  await collection.createIndex({ slug: 1 }, { unique: true })
  const report = await syncBySlug(collection, seeds, timestamp)
  const documents = await collection.find({ slug: { $in: seeds.map((seed) => seed.slug) } }).toArray()
  const ids = new Map(documents.map((document) => [document.slug, document._id]))
  if (ids.size !== seeds.length) throw new Error("Not all truck-type references could be resolved after seeding.")
  return { ...report, ids }
}
