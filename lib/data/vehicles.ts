import type { Filter } from "mongodb"
import { getBrandsCollection, getTruckTypesCollection } from "@/lib/db/collections"
import { getVehicleDocumentsCollection } from "@/lib/db/vehicles"
import { getMongoDatabase, isMongoConfigured } from "@/lib/db/mongodb"
import type { Vehicle } from "@/lib/domain/vehicle"
import { normalizeTaxonomyValue } from "@/lib/domain/vehicle-taxonomy"
import { legacyTruckToVehicle, isLegacyTruckBodyType, isLegacyTruckCategory } from "@/lib/data/truck-compatibility"
import { mockTrucks } from "@/lib/data/mock-trucks"
import { mongoVehicleDocumentSchema, type MongoVehicleDocumentInput } from "@/lib/validation/vehicle"
import type { TruckDocument } from "@/types/database"

type ReferenceValue = { id: string; name: string; slug: string }

export type VehicleIsolationIssue = {
  record: string
  fields: string[]
  message: string
}

function safeRecordKey(value: unknown, index: number) {
  if (value && typeof value === "object") {
    const candidate = value as { slug?: unknown; _id?: unknown }
    if (typeof candidate.slug === "string" && /^[a-z0-9-]{1,120}$/.test(candidate.slug)) return candidate.slug
    if (candidate._id && typeof candidate._id === "object" && "toHexString" in candidate._id) {
      try {
        return String((candidate._id as { toHexString(): string }).toHexString())
      } catch {
        // Use the non-sensitive positional identifier below.
      }
    }
  }
  return `record-${index + 1}`
}

function familyFromLegacyBodyType(bodyType: string) {
  if (bodyType === "Bus") return "Bus" as const
  if (bodyType === "Trailer") return "Trailer" as const
  if (bodyType === "Specialized / Custom") return "Special Purpose Vehicle" as const
  return "Truck" as const
}

function documentToVehicle(
  document: MongoVehicleDocumentInput,
  brand: ReferenceValue,
  type: ReferenceValue,
): Vehicle {
  const legacyBodyType = isLegacyTruckBodyType(type.name) ? type.name : undefined
  const legacyCategory = document.class && isLegacyTruckCategory(document.class) ? document.class : undefined
  const bodyType = document.bodyType || normalizeTaxonomyValue("bodyType", type.name)
  const vehicleFamily = document.vehicleFamily || (legacyBodyType ? familyFromLegacyBodyType(legacyBodyType) : undefined)
  const dutyClass = document.dutyClass || (document.class ? normalizeTaxonomyValue("dutyClass", document.class) : undefined)
  const fuelPropulsion = document.keySpecs?.fuelType
    ? normalizeTaxonomyValue("propulsion", document.keySpecs.fuelType)
    : undefined

  if (!bodyType) throw new Error("unsupported body taxonomy")
  if (!vehicleFamily) throw new Error("unsupported vehicle-family taxonomy")

  return {
    _id: document._id.toHexString(),
    slug: document.slug,
    brand,
    type,
    name: document.name,
    model: document.model,
    vehicleFamily,
    bodyType,
    dutyClass,
    propulsion: document.propulsion || fuelPropulsion || "Unknown",
    applicationTags: document.applicationTags ?? [],
    shortDescription: document.shortDescription,
    description: document.description,
    images: [...document.images].sort((first, second) => first.order - second.order),
    keySpecs: document.keySpecs
      ? {
          ...document.keySpecs,
          ...(document.keySpecs.gcmKg === undefined && document.keySpecs.gcwKg !== undefined
            ? { gcmKg: document.keySpecs.gcwKg }
            : {}),
        }
      : undefined,
    specificationGroups: document.specificationGroups ?? [],
    applications: document.applications ?? [],
    configurations: document.configurations,
    brochure: document.brochure,
    ...(document.brochureUrl ? { brochureUrl: document.brochureUrl } : {}),
    source: document.source
      ? {
          ...document.source,
          verifiedAt: document.source.verifiedAt instanceof Date
            ? document.source.verifiedAt.toISOString()
            : document.source.verifiedAt,
        }
      : undefined,
    normalization: document.normalization,
    seo: document.seo,
    featured: document.featured,
    active: document.active,
    displayOrder: document.displayOrder,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    ...(legacyBodyType && legacyCategory
      ? { legacy: { bodyType: legacyBodyType, category: legacyCategory } }
      : {}),
  }
}

export function isolateMongoVehicleDocuments(
  documents: unknown[],
  brands: Map<string, ReferenceValue>,
  types: Map<string, ReferenceValue>,
) {
  const vehicles: Vehicle[] = []
  const issues: VehicleIsolationIssue[] = []

  documents.forEach((rawDocument, index) => {
    const record = safeRecordKey(rawDocument, index)
    const parsed = mongoVehicleDocumentSchema.safeParse(rawDocument)
    if (!parsed.success) {
      issues.push({
        record,
        fields: [...new Set(parsed.error.issues.map((issue) => issue.path.join(".") || "document"))],
        message: "document validation failed",
      })
      return
    }

    const brand = brands.get(parsed.data.brandId.toHexString())
    const type = types.get(parsed.data.typeId.toHexString())
    if (!brand || !type) {
      issues.push({
        record,
        fields: [!brand ? "brandId" : "typeId"],
        message: "referenced catalog relationship is unavailable",
      })
      return
    }

    try {
      vehicles.push(documentToVehicle(parsed.data, brand, type))
    } catch (error) {
      issues.push({
        record,
        fields: ["taxonomy"],
        message: error instanceof Error ? error.message : "vehicle mapping failed",
      })
    }
  })

  return { vehicles, issues }
}

async function queryMongoVehicles(filter: Filter<TruckDocument>) {
  const db = await getMongoDatabase()
  const documents = await getVehicleDocumentsCollection(db).find(filter).sort({ displayOrder: 1, model: 1 }).toArray()
  if (!documents.length) return []

  const validRelationships = documents
    .map((document) => mongoVehicleDocumentSchema.safeParse(document))
    .filter((result) => result.success)
    .map((result) => result.data)
  const brandIds = [...new Map(validRelationships.map((document) => [document.brandId.toHexString(), document.brandId])).values()]
  const typeIds = [...new Map(validRelationships.map((document) => [document.typeId.toHexString(), document.typeId])).values()]
  const [brandDocuments, typeDocuments] = await Promise.all([
    getBrandsCollection(db).find({ _id: { $in: brandIds } }).toArray(),
    getTruckTypesCollection(db).find({ _id: { $in: typeIds } }).toArray(),
  ])
  const brands = new Map(brandDocuments.flatMap((brand) => (
    typeof brand.name === "string" && typeof brand.slug === "string"
      ? [[brand._id.toHexString(), { id: brand._id.toHexString(), name: brand.name, slug: brand.slug }] as const]
      : []
  )))
  const types = new Map(typeDocuments.flatMap((type) => (
    typeof type.name === "string" && typeof type.slug === "string"
      ? [[type._id.toHexString(), { id: type._id.toHexString(), name: type.name, slug: type.slug }] as const]
      : []
  )))
  const result = isolateMongoVehicleDocuments(documents, brands, types)

  for (const issue of result.issues) {
    console.warn(`Skipped MongoDB vehicle ${issue.record}; ${issue.message} (${issue.fields.join(", ")}).`)
  }
  return result.vehicles
}

function staticVehicles() {
  return mockTrucks.map(legacyTruckToVehicle)
}

export async function getVehicles(): Promise<Vehicle[]> {
  if (!isMongoConfigured()) return staticVehicles()
  try {
    return await queryMongoVehicles({ active: true })
  } catch {
    console.error("MongoDB vehicle catalog query failed; using the verified static fallback.")
    return staticVehicles()
  }
}

export async function getVehicleBySlug(slug: string): Promise<Vehicle | null> {
  if (!isMongoConfigured()) return staticVehicles().find((vehicle) => vehicle.slug === slug) ?? null
  try {
    return (await queryMongoVehicles({ active: true, slug }))[0] ?? null
  } catch {
    console.error("MongoDB vehicle lookup failed; using the verified static fallback.")
    return staticVehicles().find((vehicle) => vehicle.slug === slug) ?? null
  }
}

export async function getFeaturedVehicles(limit = 6) {
  return (await getVehicles()).filter((vehicle) => vehicle.featured).slice(0, limit)
}

export function rankRelatedVehicles(vehicle: Vehicle, candidates: Vehicle[]) {
  return candidates
    .filter((candidate) => candidate.slug !== vehicle.slug)
    .map((candidate) => {
      const sharedApplications = candidate.applicationTags.filter((tag) => vehicle.applicationTags.includes(tag)).length
      const score =
        Number(candidate.bodyType === vehicle.bodyType) * 100 +
        Number(candidate.vehicleFamily === vehicle.vehicleFamily) * 40 +
        Number(candidate.brand.id && candidate.brand.id === vehicle.brand.id) * 30 +
        Number(candidate.dutyClass && candidate.dutyClass === vehicle.dutyClass) * 15 +
        sharedApplications * 5 +
        Number(candidate.propulsion === vehicle.propulsion) * 3
      return { candidate, score }
    })
    .sort((first, second) => second.score - first.score || first.candidate.displayOrder - second.candidate.displayOrder)
    .map(({ candidate }) => candidate)
}
