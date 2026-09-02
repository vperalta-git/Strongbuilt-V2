import type { Db, ObjectId } from "mongodb"
import { getTrucksCollection } from "@/lib/db/collections"
import type { TruckSeed } from "@/lib/validation/database"
import { syncBySlug, type SeedReport } from "@/scripts/seed-helpers"

export async function seedTrucks(
  db: Db,
  seeds: TruckSeed[],
  brandIds: Map<string, ObjectId>,
  truckTypeIds: Map<string, ObjectId>,
  timestamp: Date,
): Promise<SeedReport> {
  const records = seeds.map(({ brandSlug, typeSlug, ...seed }) => {
    const brandId = brandIds.get(brandSlug)
    const typeId = truckTypeIds.get(typeSlug)
    if (!brandId) throw new Error(`Truck ${seed.slug} references unknown brand ${brandSlug}.`)
    if (!typeId) throw new Error(`Truck ${seed.slug} references unknown truck type ${typeSlug}.`)
    return { ...seed, brandId, typeId }
  })

  const collection = getTrucksCollection(db)
  await Promise.all([
    collection.createIndex({ slug: 1 }, { unique: true }),
    collection.createIndex({ brandId: 1 }),
    collection.createIndex({ typeId: 1 }),
    collection.createIndex({ featured: 1 }),
    collection.createIndex({ active: 1 }),
  ])
  return syncBySlug(collection, records, timestamp)
}
