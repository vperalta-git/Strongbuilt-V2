import type { Db, ObjectId } from "mongodb"
import { getBrandsCollection } from "@/lib/db/collections"
import type { BrandSeed } from "@/lib/validation/database"
import { syncBySlug, type SeedReport } from "@/scripts/seed-helpers"

export async function seedBrands(db: Db, seeds: BrandSeed[], timestamp: Date): Promise<SeedReport & { ids: Map<string, ObjectId> }> {
  const collection = getBrandsCollection(db)
  await collection.createIndex({ slug: 1 }, { unique: true })
  const report = await syncBySlug(collection, seeds, timestamp)
  const documents = await collection.find({ slug: { $in: seeds.map((seed) => seed.slug) } }).toArray()
  const ids = new Map(documents.map((document) => [document.slug, document._id]))
  if (ids.size !== seeds.length) throw new Error("Not all brand references could be resolved after seeding.")
  return { ...report, ids }
}
