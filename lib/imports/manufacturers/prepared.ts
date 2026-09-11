import { z } from "zod"
import type { VehicleNormalizationDecision } from "@/lib/domain/vehicle"
import { normalizeTaxonomyValue } from "@/lib/domain/vehicle-taxonomy"
import type {
  ManufacturerAdapter,
  ManufacturerBrandSource,
  ManufacturerImportIssue,
} from "@/lib/imports/core/types"
import type { RawVehicleImport } from "@/lib/validation/vehicle-import"
import { existingLocalImagePath } from "@/lib/imports/core/images"

const nonEmptyString = z.string().trim().min(1)
const nullableString = nonEmptyString.nullable().optional()

const preparedBrandSchema = z.object({
  name: nonEmptyString,
  slug: nonEmptyString,
  officialWebsite: z.url(),
  logo: z.object({
    url: z.url().nullable(),
    alt: nonEmptyString,
    localPathSuggested: nonEmptyString.optional(),
    status: nonEmptyString.optional(),
  }).passthrough(),
  description: nonEmptyString,
  active: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
  source: z.object({
    verifiedAt: nonEmptyString.refine(
      (value) => !Number.isNaN(new Date(value).valueOf()),
      "Use a valid verification date.",
    ),
  }).passthrough(),
}).passthrough()

const preparedImageSchema = z.object({
  url: z.url().nullable(),
  sourcePage: z.url().optional(),
  alt: nonEmptyString,
  isPrimary: z.boolean(),
  order: z.number().int().nonnegative(),
  localPathSuggested: nonEmptyString.optional(),
  status: nonEmptyString.optional(),
}).passthrough()

const specificationGroupSchema = z.object({
  title: nonEmptyString,
  items: z.array(z.object({
    label: nonEmptyString,
    value: nonEmptyString,
    featured: z.boolean().optional(),
  }).passthrough()).min(1),
}).passthrough()

export const preparedTruckSourceSchema = z.object({
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
  images: z.array(preparedImageSchema),
  imageStatus: nonEmptyString,
  keySpecs: z.record(z.string(), z.unknown()),
  specificationGroups: z.array(specificationGroupSchema),
  configurations: z.array(nonEmptyString).optional(),
  applications: z.array(nonEmptyString),
  brochureUrl: z.url().nullable().optional(),
  seo: z.object({
    title: nonEmptyString.optional(),
    description: nonEmptyString.optional(),
  }).optional(),
  source: z.object({
    website: nonEmptyString,
    productUrl: z.url(),
    parameterUrl: z.url().nullable().optional(),
    verifiedAt: nonEmptyString.refine(
      (value) => !Number.isNaN(new Date(value).valueOf()),
      "Use a valid verification date.",
    ),
  }).passthrough(),
  notes: nullableString,
  sourceDataWarning: nullableString,
}).passthrough()

export type PreparedBrandSource = z.infer<typeof preparedBrandSchema>
export type PreparedTruckSource = z.infer<typeof preparedTruckSourceSchema>

export type PreparedTaxonomy = {
  vehicleFamily: string
  bodyType: string
  dutyClass?: string
  propulsion?: string
  legacyTypeSlug: string
  issues?: ManufacturerImportIssue[]
  decisions?: VehicleNormalizationDecision[]
}

type PreparedAdapterOptions = {
  normalizeTaxonomy(record: PreparedTruckSource): PreparedTaxonomy
}

export function preparedIssue(
  severity: "warning" | "error",
  field: string,
  message: string,
  code: string,
  sourceValue?: unknown,
  normalizedValue?: unknown,
): ManufacturerImportIssue {
  return { severity, field, message, reason: message, code, sourceValue, normalizedValue }
}

function schemaIssues(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): ManufacturerImportIssue[] {
  return error.issues.map((issue) => preparedIssue(
    "error",
    issue.path.map(String).join(".") || "document",
    issue.message,
    "INVALID_SOURCE_SHAPE",
  ))
}

function exactNumber(value: unknown, unit?: string) {
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value
  if (typeof value !== "string") return undefined
  const suffix = unit ? `\\s*${unit}` : ""
  const match = value.match(new RegExp(`^\\s*([\\d,.]+)${suffix}\\s*$`, "i"))
  return match ? Number(match[1].replaceAll(",", "")) : undefined
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined
}

function scalarValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value
  if (typeof value === "number" && Number.isFinite(value) && value >= 0) return value
  return undefined
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}

function sourcePropulsion(record: PreparedTruckSource) {
  const values = [
    record.category,
    record.keySpecs.fuelType,
    record.keySpecs.fuelOptions,
    ...(record.configurations || []),
  ].filter((value): value is string => typeof value === "string").join(" ").toLowerCase()
  if (values.includes("hybrid")) return "Hybrid"
  if (values.includes("electric")) return "Battery Electric"
  const fuels = new Set<string>()
  if (values.includes("diesel")) fuels.add("Diesel")
  if (values.includes("gasoline")) fuels.add("Gasoline")
  if (values.includes("cng")) fuels.add("CNG")
  if (values.includes("lng")) fuels.add("LNG")
  if (values.includes("natural gas")) fuels.add("Natural Gas")
  if (fuels.size > 1 || fuels.has("Natural Gas")) return "Multiple / Configurable"
  return [...fuels][0] || "Unknown"
}

function applicationTags(applications: string[]) {
  const value = applications.join(" ").toLowerCase()
  const tags: string[] = []
  if (/construction|concrete|aggregate|building material|muck/.test(value)) tags.push("Construction")
  if (/mining/.test(value)) tags.push("Mining")
  if (/long-haul|long haul|long-distance|trunk logistics|heavy transport/.test(value)) tags.push("Long Haul")
  if (/urban|last-mile|logistics|distribution|delivery|retail|commercial cargo/.test(value)) tags.push("Urban Logistics")
  if (/refrigerated|cold chain/.test(value)) tags.push("Cold Chain")
  if (/public transport|passenger|intercity|shuttle|group transport/.test(value)) tags.push("Public Transport")
  if (/tourism/.test(value)) tags.push("Tourism")
  if (/airport|apron|airside/.test(value)) tags.push("Airport")
  if (/garbage|waste|refuse/.test(value)) tags.push("Waste Collection")
  if (/municipal|sanitation|road sweeping|snow removal|water sprinkling/.test(value)) tags.push("Municipal")
  if (/medical|health|blood collection|patient|hospital/.test(value)) tags.push("Medical")
  if (/emergency|ambulance|rescue/.test(value)) tags.push("Emergency")
  if (/port|harbor|terminal/.test(value)) tags.push("Port Operations")
  if (/container/.test(value)) tags.push("Container Transport")
  return [...new Set(tags)]
}

function titleFromKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\b(Kg|Kw|Kwh|Mm|Nm|Ps|Hp|Kph|M3)\b/gi, (unit) => unit.toUpperCase())
    .replace(/^./, (character) => character.toUpperCase())
}

function preservedSpecificationGroups(record: PreparedTruckSource) {
  const groups = record.specificationGroups.map((group) => ({
    title: group.title,
    items: group.items.map(({ label, value, featured }) => ({ label, value, ...(featured === undefined ? {} : { featured }) })),
  }))
  const representedValues = new Set(groups.flatMap((group) => group.items.map((item) => item.value.trim().toLowerCase())))
  const additionalItems = Object.entries(record.keySpecs).flatMap(([key, value]) => {
    if ((typeof value !== "string" && typeof value !== "number") || representedValues.has(String(value).trim().toLowerCase())) return []
    return [{ label: titleFromKey(key), value: String(value) }]
  })
  return additionalItems.length ? [...groups, { title: "Source Summary", items: additionalItems }] : groups
}

function normalizedKeySpecs(record: PreparedTruckSource) {
  const source = record.keySpecs
  const engineDisplacement = stringValue(source.displacement)
    || stringValue(source.engineDisplacement)
    || (exactNumber(source.displacementL) !== undefined ? `${exactNumber(source.displacementL)} L` : undefined)
  return compact({
    engine: stringValue(source.engine) || stringValue(source.engineOptions) || stringValue(source.engineBrands),
    engineDisplacement,
    horsepower: exactNumber(source.horsepower) || exactNumber(source.powerHp) || exactNumber(source.maximumPower, "hp"),
    powerKw: exactNumber(source.maximumPowerKw) || exactNumber(source.ratedPowerKw) || exactNumber(source.motorPowerKw)
      || exactNumber(source.motorPeakPowerKw) || exactNumber(source.netPower, "kW"),
    powerPs: exactNumber(source.maximumPower, "PS"),
    torqueNm: exactNumber(source.maximumTorqueNm) || exactNumber(source.torqueNm)
      || exactNumber(source.motorPeakTorqueNm) || exactNumber(source.maximumTorque, "Nm"),
    transmission: stringValue(source.transmission) || stringValue(source.gearbox) || stringValue(source.transmissionOptions),
    drive: stringValue(source.drive) || stringValue(source.driveOptions),
    wheelbaseMm: exactNumber(source.wheelbaseMm),
    gvwKg: exactNumber(source.gvwKg) || exactNumber(source.grossLoadedMassKg),
    payloadKg: exactNumber(source.payloadKg) || exactNumber(source.maximumLoadKg),
    seatingCapacity: scalarValue(source.seatingCapacity ?? source.passengers ?? source.seats ?? source.ratedPassengerCapacity),
    batteryCapacityKwh: scalarValue(source.batteryKwh ?? source.batteryCapacityKwh),
    rangeKm: scalarValue(source.rangeKm),
    fuelType: stringValue(source.fuelType) || stringValue(source.fuelOptions),
    emissionStandard: stringValue(source.emissionStandard),
    bodyCapacity: stringValue(source.bodyCapacity) || stringValue(source.mixerCapacity),
    rearBodyLength: stringValue(source.cargoBodyLength),
  })
}

function normalizePreparedRecord(
  record: PreparedTruckSource,
  brand: PreparedBrandSource,
  taxonomy: PreparedTaxonomy,
) {
  const propulsion = taxonomy.propulsion || sourcePropulsion(record)
  const issues: ManufacturerImportIssue[] = [
    preparedIssue(
      "warning",
      "source.dataWarnings",
      "Manufacturer availability/configuration warning retained for manual review.",
      "REGIONAL_CONFIGURATION_WARNING",
      record.availabilityNote,
      record.availabilityNote,
    ),
    ...(taxonomy.issues || []),
  ]
  if (!record.images.some((image) => image.url && existingLocalImagePath(image.localPathSuggested))) {
    issues.push(preparedIssue(
      "warning",
      "images",
      "No validated local manufacturer image is available; the frontend photography-unavailable fallback will be used.",
      "LOCAL_IMAGE_FALLBACK_REQUIRED",
      record.imageStatus,
      null,
    ))
  }
  if (record.notes) {
    issues.push(preparedIssue("warning", "source.dataWarnings", "Manufacturer source note retained for manual QA.", "MANUFACTURER_SOURCE_WARNING", record.notes, record.notes))
  }
  if (record.sourceDataWarning) {
    issues.push(preparedIssue("warning", "source.dataWarnings", "Prepared source QA warning retained through normalization.", "SOURCE_DATA_WARNING", record.sourceDataWarning, record.sourceDataWarning))
  }

  const decisions: VehicleNormalizationDecision[] = [
    {
      field: "active",
      rawValue: record.active,
      normalizedValue: false,
      reason: "Manufacturer availability is preserved in raw data; staging candidates remain inactive until an approved promotion.",
    },
    {
      field: "category",
      rawValue: record.category,
      normalizedValue: { vehicleFamily: taxonomy.vehicleFamily, bodyType: taxonomy.bodyType },
      reason: "Mapped the manufacturer category into the canonical Vehicle taxonomy.",
    },
    ...(taxonomy.decisions || []),
  ]
  const dataWarnings = [record.availabilityNote, record.notes, record.sourceDataWarning].filter((value): value is string => Boolean(value))
  const validImages = record.images.flatMap((image) => {
    const localPath = existingLocalImagePath(image.localPathSuggested)
    return image.url && localPath ? [{ image: image as typeof image & { url: string }, localPath }] : []
  })
  const input: RawVehicleImport = {
    slug: record.slug,
    brandSlug: record.brandSlug,
    name: record.name,
    model: record.model,
    vehicleFamily: normalizeTaxonomyValue("vehicleFamily", taxonomy.vehicleFamily) || taxonomy.vehicleFamily,
    bodyType: normalizeTaxonomyValue("bodyType", taxonomy.bodyType) || taxonomy.bodyType,
    ...(taxonomy.dutyClass ? { dutyClass: normalizeTaxonomyValue("dutyClass", taxonomy.dutyClass) || taxonomy.dutyClass } : {}),
    propulsion: normalizeTaxonomyValue("propulsion", propulsion) || propulsion,
    applicationTags: applicationTags(record.applications),
    shortDescription: record.shortDescription,
    images: validImages.map(({ image, localPath }, index) => ({
      url: localPath,
      alt: image.alt,
      isPrimary: index === 0,
      order: index + 1,
      sourceUrl: image.url,
      sourcePage: image.sourcePage || record.source.productUrl,
      storageProvider: "local" as const,
      suggestedLocalPath: localPath,
      status: "local-asset-ready",
    })),
    keySpecs: normalizedKeySpecs(record),
    specificationGroups: preservedSpecificationGroups(record),
    applications: record.applications,
    configurations: record.configurations,
    ...(record.brochureUrl ? {
      brochure: { url: record.brochureUrl, title: `${record.model} brochure source`, source: record.source.website },
      brochureUrl: record.brochureUrl,
    } : {}),
    source: {
      manufacturer: brand.name,
      website: brand.officialWebsite,
      productUrl: record.source.productUrl,
      ...(record.source.parameterUrl ? { alternateSourceUrls: [record.source.parameterUrl] } : {}),
      verifiedAt: record.source.verifiedAt,
      notes: record.availabilityNote,
      dataWarnings,
    },
    seo: record.seo,
    featured: record.featured,
    active: false,
    displayOrder: 0,
  }
  return { input, legacyTypeSlug: taxonomy.legacyTypeSlug, decisions, issues }
}

export function createPreparedManufacturerAdapter(options: PreparedAdapterOptions): ManufacturerAdapter {
  return {
    parseBrand(raw) {
      const parsed = preparedBrandSchema.safeParse(raw)
      return parsed.success
        ? { success: true, data: parsed.data }
        : { success: false, issues: schemaIssues(parsed.error) }
    },
    normalizeVehicle(raw, brand: ManufacturerBrandSource) {
      const parsed = preparedTruckSourceSchema.safeParse(raw)
      if (!parsed.success) {
        const identity = raw && typeof raw === "object" ? raw as Record<string, unknown> : {}
        return {
          success: false,
          model: typeof identity.model === "string" ? identity.model : undefined,
          slug: typeof identity.slug === "string" ? identity.slug : undefined,
          issues: schemaIssues(parsed.error),
        }
      }
      const taxonomy = options.normalizeTaxonomy(parsed.data)
      return { success: true, ...normalizePreparedRecord(parsed.data, brand as PreparedBrandSource, taxonomy) }
    },
  }
}
