import type { Db, ObjectId } from "mongodb"
import { getIndustriesCollection } from "@/lib/db/collections"
import type { IndustrySeed } from "@/lib/validation/database"
import { syncBySlug, type SeedReport } from "@/scripts/seed-helpers"

export async function seedIndustries(
  db: Db,
  seeds: IndustrySeed[],
  truckTypeIds: Map<string, ObjectId>,
  timestamp: Date,
): Promise<SeedReport> {
  const records = seeds.map(({ recommendedTruckTypeSlugs = [], ...seed }) => ({
    ...seed,
    recommendedTruckTypeIds: recommendedTruckTypeSlugs.map((slug) => {
      const id = truckTypeIds.get(slug)
      if (!id) throw new Error(`Industry ${seed.slug} references unknown truck type ${slug}.`)
      return id
    }),
  }))
  const collection = getIndustriesCollection(db)
  await collection.createIndex({ slug: 1 }, { unique: true })
  return syncBySlug(collection, records, timestamp)
}
