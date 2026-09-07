import type { Db, ObjectId } from "mongodb"
import { getBrandsCollection, getTruckTypesCollection } from "@/lib/db/collections"
import type { ManufacturerConfiguration } from "@/lib/imports/core/types"

function comparable(value: string) {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "")
}

export type ResolvedBrand = {
  id?: ObjectId
  name?: string
  slug: string
  matchedBy?: "slug" | "name" | "alias"
}

export async function resolveManufacturerBrand(db: Db, config: ManufacturerConfiguration): Promise<ResolvedBrand> {
  const targets = new Set([config.slug, config.displayName, ...config.brandAliases].map(comparable))
  const brands = await getBrandsCollection(db)
    .find({}, { projection: { _id: 1, name: 1, slug: 1, aliases: 1 } })
    .toArray()

  const matches: Array<{ brand: (typeof brands)[number]; matchedBy: "slug" | "name" | "alias" }> = []
  for (const brand of brands) {
    const aliases = Array.isArray((brand as { aliases?: unknown }).aliases)
      ? (brand as unknown as { aliases: string[] }).aliases
      : []
    if (targets.has(comparable(brand.slug))) matches.push({ brand, matchedBy: "slug" })
    else if (targets.has(comparable(brand.name))) matches.push({ brand, matchedBy: "name" })
    else if (aliases.some((alias) => targets.has(comparable(alias)))) matches.push({ brand, matchedBy: "alias" })
  }
  if (matches.length > 1) throw new Error(`Brand aliases for ${config.displayName} resolve to more than one brand document.`)
  const match = matches[0]
  return match
    ? { id: match.brand._id, name: match.brand.name, slug: match.brand.slug, matchedBy: match.matchedBy }
    : { slug: config.slug }
}

export type ResolvedLegacyType = { id: ObjectId; name: string; slug: string }

export async function resolveLegacyTypes(
  db: Db,
  config: ManufacturerConfiguration,
  sourceTypeSlugs: Iterable<string>,
) {
  const requested = [...new Set([...sourceTypeSlugs])]
  const canonicalSlugs = new Set(requested.map((slug) => config.legacyTypeAliases[slug] || slug))
  const types = await getTruckTypesCollection(db)
    .find({ slug: { $in: [...canonicalSlugs] } }, { projection: { _id: 1, name: 1, slug: 1 } })
    .toArray()
  const bySlug = new Map(types.map((type) => [type.slug, type]))
  return new Map(requested.flatMap((sourceSlug) => {
    const targetSlug = config.legacyTypeAliases[sourceSlug] || sourceSlug
    const document = bySlug.get(targetSlug)
    return document ? [[sourceSlug, { id: document._id, name: document.name, slug: document.slug } satisfies ResolvedLegacyType] as const] : []
  }))
}
