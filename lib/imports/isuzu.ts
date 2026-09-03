import { z } from "zod"
import type { VehicleNormalizationDecision } from "@/lib/domain/vehicle"
import { normalizeTaxonomyValue } from "@/lib/domain/vehicle-taxonomy"
import type { RawVehicleImport, VehicleImportIssue } from "@/lib/validation/vehicle-import"

const nonEmptyString = z.string().trim().min(1)
const nullableString = nonEmptyString.nullable().optional()

export const isuzuTestModels = [
  "NMR85HS",
  "NQR75LS",
  "QLR77E",
  "NLR85ES",
  "NLR77H",
  "NLR85E",
  "NMR85H",
  "NPR85K",
] as const

export const isuzuBrandSourceSchema = z.object({
  name: nonEmptyString,
  slug: nonEmptyString,
  officialWebsite: z.url(),
  active: z.boolean(),
  source: z.object({
    website: z.url(),
    verifiedAt: nonEmptyString,
  }),
}).passthrough()

const isuzuImageSourceSchema = z.object({
  url: z.url(),
  alt: nonEmptyString,
  isPrimary: z.boolean(),
  order: z.number().int().nonnegative(),
  localPathSuggested: nonEmptyString.optional(),
}).passthrough()

const isuzuKeySpecsSourceSchema = z.object({
  engine: nonEmptyString.optional(),
  displacementCc: z.number().finite().nonnegative().optional(),
  maximumPower: nonEmptyString.optional(),
  maximumTorque: nonEmptyString.optional(),
  transmission: nonEmptyString.optional(),
  gvwKg: z.number().finite().nonnegative().optional(),
  gcmKg: z.number().finite().nonnegative().optional(),
  payloadKg: z.number().finite().nonnegative().optional(),
  wheelbaseMm: z.number().finite().nonnegative().optional(),
  rearBodyLength: nonEmptyString.optional(),
  fuelType: nonEmptyString.optional(),
  emissionStandard: nonEmptyString.optional(),
}).passthrough()

const specificationGroupSchema = z.object({
  title: nonEmptyString,
  items: z.array(z.object({
    label: nonEmptyString,
    value: nonEmptyString,
    featured: z.boolean().optional(),
  }).passthrough()),
}).passthrough()

export const isuzuTruckSourceSchema = z.object({
  slug: nonEmptyString,
  brand: nonEmptyString,
  brandSlug: nonEmptyString,
  name: nonEmptyString,
  model: nonEmptyString,
  productLine: nonEmptyString,
  category: nonEmptyString,
  truckTypeSlug: nonEmptyString,
  class: nullableString,
  shortDescription: nonEmptyString,
  featured: z.boolean(),
  active: z.boolean(),
  availabilityStatus: nonEmptyString,
  availabilityNote: nonEmptyString,
  configurations: z.array(nonEmptyString),
  images: z.array(isuzuImageSourceSchema).min(1),
  imageStatus: nonEmptyString,
  keySpecs: isuzuKeySpecsSourceSchema,
  specificationGroups: z.array(specificationGroupSchema),
  applications: z.array(nonEmptyString),
  brochureUrl: z.url(),
  seo: z.object({
    title: nonEmptyString.optional(),
    description: nonEmptyString.optional(),
  }).optional(),
  source: z.object({
    website: nonEmptyString,
    productUrl: z.url(),
    verifiedAt: nonEmptyString,
  }),
  notes: nullableString,
}).passthrough()

export type IsuzuBrandSource = z.infer<typeof isuzuBrandSourceSchema>
export type IsuzuTruckSource = z.infer<typeof isuzuTruckSourceSchema>

export type ManufacturerImportIssue = VehicleImportIssue & {
  sourceValue?: unknown
  normalizedValue?: unknown
  reason?: string
}

export type IsuzuNormalizationResult = {
  input: RawVehicleImport
  decisions: VehicleNormalizationDecision[]
  issues: ManufacturerImportIssue[]
}

function firstNumber(value: string | undefined, unit: string) {
  if (!value) return undefined
  const match = value.match(new RegExp(`([\\d,.]+)\\s*${unit}`, "i"))
  return match ? Number(match[1].replaceAll(",", "")) : undefined
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}

function warning(
  field: string,
  sourceValue: unknown,
  normalizedValue: unknown,
  reason: string,
  code: string,
): ManufacturerImportIssue {
  return { severity: "warning", field, message: reason, sourceValue, normalizedValue, reason, code }
}

function sourceTaxonomy(record: IsuzuTruckSource) {
  const family = record.category.includes("Rigid Truck") ? "Truck" : record.category
  const bodyType = record.category.includes("Rigid Truck") ? "Rigid Truck" : record.category
  const dutyClass = record.class || undefined
  const propulsion = record.keySpecs.fuelType || "Unknown"

  return {
    vehicleFamily: normalizeTaxonomyValue("vehicleFamily", family) || family,
    bodyType: normalizeTaxonomyValue("bodyType", bodyType) || bodyType,
    dutyClass: dutyClass ? normalizeTaxonomyValue("dutyClass", dutyClass) || dutyClass : undefined,
    propulsion: normalizeTaxonomyValue("propulsion", propulsion) || propulsion,
  }
}

function sourceApplicationTags(applications: string[]) {
  return applications.flatMap((application) => {
    const normalized = normalizeTaxonomyValue("applicationTag", application)
    return normalized ? [normalized] : []
  })
}

export function normalizeIsuzuSourceRecord(
  record: IsuzuTruckSource,
  brand: IsuzuBrandSource,
): IsuzuNormalizationResult {
  const taxonomy = sourceTaxonomy(record)
  const powerKw = firstNumber(record.keySpecs.maximumPower, "kW")
  const powerPs = firstNumber(record.keySpecs.maximumPower, "PS")
  const torqueNm = firstNumber(record.keySpecs.maximumTorque, "Nm")
  const issues: ManufacturerImportIssue[] = []
  const decisions: VehicleNormalizationDecision[] = [
    {
      field: "active",
      rawValue: record.active,
      normalizedValue: false,
      reason: "Manufacturer availability is preserved in raw data; staging candidates remain inactive until a future approved promotion.",
    },
    {
      field: "category",
      rawValue: record.category,
      normalizedValue: { vehicleFamily: taxonomy.vehicleFamily, bodyType: taxonomy.bodyType },
      reason: "Mapped the manufacturer category into the canonical Vehicle taxonomy.",
    },
  ]

  if (record.notes) {
    issues.push(warning(
      "source.dataWarnings",
      record.notes,
      record.notes,
      "Manufacturer-source discrepancy retained for manual QA.",
      "MANUFACTURER_SOURCE_WARNING",
    ))
  }

  const keySpecs = compact({
    engine: record.keySpecs.engine,
    engineDisplacementCc: record.keySpecs.displacementCc,
    powerKw,
    powerPs,
    torqueNm,
    transmission: record.keySpecs.transmission,
    wheelbaseMm: record.keySpecs.wheelbaseMm,
    gvwKg: record.keySpecs.gvwKg,
    payloadKg: record.keySpecs.payloadKg,
    gcmKg: record.keySpecs.gcmKg,
    fuelType: record.keySpecs.fuelType,
    emissionStandard: record.keySpecs.emissionStandard,
    rearBodyLength: record.keySpecs.rearBodyLength,
  })

  return {
    input: {
      slug: record.slug,
      brandSlug: record.brandSlug,
      name: record.name,
      model: record.model,
      vehicleFamily: taxonomy.vehicleFamily,
      bodyType: taxonomy.bodyType,
      dutyClass: taxonomy.dutyClass,
      propulsion: taxonomy.propulsion,
      applicationTags: sourceApplicationTags(record.applications),
      shortDescription: record.shortDescription,
      images: record.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        isPrimary: image.isPrimary,
        order: image.order,
        sourceUrl: image.url,
        sourcePage: record.source.productUrl,
        storageProvider: "external" as const,
        suggestedLocalPath: image.localPathSuggested,
        status: record.imageStatus,
      })),
      keySpecs,
      specificationGroups: record.specificationGroups,
      applications: record.applications,
      configurations: record.configurations,
      brochure: {
        url: record.brochureUrl,
        title: `${record.model} brochure source`,
        source: record.source.website,
      },
      brochureUrl: record.brochureUrl,
      source: {
        manufacturer: brand.name,
        website: brand.officialWebsite,
        productUrl: record.source.productUrl,
        verifiedAt: record.source.verifiedAt,
        notes: record.availabilityNote,
        ...(record.notes ? { dataWarnings: [record.notes] } : {}),
      },
      seo: record.seo,
      featured: record.featured,
      active: false,
      displayOrder: 0,
    },
    decisions,
    issues,
  }
}
