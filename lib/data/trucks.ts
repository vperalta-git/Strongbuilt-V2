import { ObjectId, type WithId } from "mongodb"
import { getBrandsCollection, getTrucksCollection, getTruckTypesCollection } from "@/lib/db/collections"
import { getMongoDatabase, isMongoConfigured } from "@/lib/db/mongodb"
import { mockTrucks } from "@/lib/data/mock-trucks"
import type { TruckDocument } from "@/types/database"
import type { Truck, TruckBodyType, TruckCategory, TruckSpecification } from "@/types/truck"

const categories = new Set<TruckCategory>(["Light Duty", "Medium Duty", "Heavy Duty", "Passenger", "Trailer"])
const bodyTypes = new Set<TruckBodyType>(["Cargo", "Dump Truck", "Tractor Head", "Bus", "Trailer", "Specialized / Custom"])
const specificationGroups = new Set<TruckSpecification["group"]>([
  "Powertrain",
  "Dimensions & capacity",
  "Chassis & running gear",
  "Equipment",
])

function serializeTruck(
  document: WithId<TruckDocument>,
  brandNames: Map<string, string>,
  typeNames: Map<string, string>,
): Truck {
  const brand = brandNames.get(document.brandId.toHexString())
  const bodyType = typeNames.get(document.typeId.toHexString())
  if (!brand || !bodyType || !bodyTypes.has(bodyType as TruckBodyType)) {
    throw new Error(`Truck ${document.slug} has an unresolved brand or truck-type reference.`)
  }
  if (!document.class || !categories.has(document.class as TruckCategory)) {
    throw new Error(`Truck ${document.slug} has an unsupported vehicle class.`)
  }

  const specifications: TruckSpecification[] = (document.specificationGroups ?? []).flatMap((group) => {
    if (!specificationGroups.has(group.title as TruckSpecification["group"])) {
      throw new Error(`Truck ${document.slug} has an unsupported specification group.`)
    }
    return group.items.map((item) => ({
      label: item.label,
      value: item.value,
      group: group.title as TruckSpecification["group"],
      ...(item.featured === undefined ? {} : { featured: item.featured }),
    }))
  })

  return {
    _id: document._id.toHexString(),
    slug: document.slug,
    brand,
    model: document.model || document.name,
    category: document.class as TruckCategory,
    bodyType: bodyType as TruckBodyType,
    shortDescription: document.shortDescription || "",
    description: document.description || "",
    images: [...document.images]
      .sort((first, second) => first.order - second.order)
      .map(({ url, alt }) => ({ url, alt })),
    featured: document.featured,
    active: document.active,
    applications: document.applications ?? [],
    configurations: document.configurations,
    specifications,
    ...(document.brochureUrl ? { brochureUrl: document.brochureUrl } : {}),
    seo: document.seo,
    displayOrder: document.displayOrder,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
  }
}

export async function getTrucks(): Promise<Truck[]> {
  if (!isMongoConfigured()) return mockTrucks

  try {
    const db = await getMongoDatabase()
    const documents = await getTrucksCollection(db).find({ active: true }).sort({ displayOrder: 1, model: 1 }).toArray()
    if (!documents.length) return mockTrucks

    const brandIds = [...new Set(documents.map((document) => document.brandId.toHexString()))].map((id) => new ObjectId(id))
    const typeIds = [...new Set(documents.map((document) => document.typeId.toHexString()))].map((id) => new ObjectId(id))
    const [brands, types] = await Promise.all([
      getBrandsCollection(db).find({ _id: { $in: brandIds } }).toArray(),
      getTruckTypesCollection(db).find({ _id: { $in: typeIds } }).toArray(),
    ])

    const brandNames = new Map(brands.map((brand) => [brand._id.toHexString(), brand.name]))
    const typeNames = new Map(types.map((type) => [type._id.toHexString(), type.name]))
    return documents.map((document) => serializeTruck(document, brandNames, typeNames))
  } catch (error) {
    console.error("MongoDB trucks are unavailable.", error)
    return mockTrucks
  }
}

export async function getTruckBySlug(slug: string): Promise<Truck | null> {
  const trucks = await getTrucks()
  return trucks.find((truck) => truck.slug === slug) ?? null
}

export async function getFeaturedTrucks(limit = 6): Promise<Truck[]> {
  const trucks = await getTrucks()
  return trucks.filter((truck) => truck.featured).slice(0, limit)
}

export async function getRelatedTrucks(truck: Truck, limit = 3): Promise<Truck[]> {
  const trucks = await getTrucks()
  const matched = trucks.filter(
    (candidate) =>
      candidate.slug !== truck.slug &&
      (candidate.bodyType === truck.bodyType || candidate.brand === truck.brand),
  )
  const fallback = trucks.filter(
    (candidate) => candidate.slug !== truck.slug && !matched.some((match) => match.slug === candidate.slug),
  )
  return [...matched, ...fallback].slice(0, limit)
}
