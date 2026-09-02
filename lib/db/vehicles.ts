import type { Db, ObjectId } from "mongodb"
import { getBrandsCollection, getTrucksCollection, getTruckTypesCollection } from "@/lib/db/collections"

/**
 * Canonical Vehicle domain compatibility helpers.
 * MongoDB intentionally continues to use `trucks` and `truckTypes` in this phase.
 */
export const getVehicleDocumentsCollection = (db: Db) => getTrucksCollection(db)
export const getVehicleTypesCompatibilityCollection = (db: Db) => getTruckTypesCollection(db)

export function normalizeBrandSlug(slug: string) {
  return slug.trim().toLowerCase()
}

export function resolveBrandId(brandSlug: string, brandIds: Map<string, ObjectId>) {
  const normalizedSlug = normalizeBrandSlug(brandSlug)
  const brandId = brandIds.get(normalizedSlug)
  if (!brandId) throw new Error(`Unknown brand slug: ${normalizedSlug || "(empty)"}.`)
  return brandId
}

export async function resolveBrandIdsBySlug(db: Db, brandSlugs: string[]) {
  const normalizedSlugs = [...new Set(brandSlugs.map(normalizeBrandSlug).filter(Boolean))]
  const documents = await getBrandsCollection(db)
    .find({ slug: { $in: normalizedSlugs } }, { projection: { _id: 1, slug: 1 } })
    .toArray()
  return new Map(documents.map((document) => [normalizeBrandSlug(document.slug), document._id]))
}
