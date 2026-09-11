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

const fawBrandSourceSchema = z.object({
  name: nonEmptyString,
  slug: nonEmptyString,
  officialWebsite: z.url(),
  logo: z.object({
    url: z.url(),
    alt: nonEmptyString,
    localPathSuggested: nonEmptyString.optional(),
  }).passthrough(),
  description: nonEmptyString,
  active: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
  source: z.object({
    logoAnnouncementUrl: z.url().optional(),
    verifiedAt: nonEmptyString.refine(
      (value) => !Number.isNaN(new Date(value).valueOf()),
      "Use a valid verification date.",
    ),
  }).passthrough(),
}).passthrough()

const fawImageSourceSchema = z.object({
  url: z.url().nullable(),
  alt: nonEmptyString,
  isPrimary: z.boolean(),
  order: z.number().int().nonnegative(),
  localPathSuggested: nonEmptyString.optional(),
}).passthrough()

const fawKeySpecsSourceSchema = z.object({
  engine: nonEmptyString.optional(),
  engineOptions: nonEmptyString.optional(),
  displacement: nonEmptyString.optional(),
  engineDisplacement: nonEmptyString.optional(),
  maximumPower: nonEmptyString.optional(),
  power: nonEmptyString.optional(),
  powerOptions: nonEmptyString.optional(),
  powerRange: nonEmptyString.optional(),
  maximumTorque: nonEmptyString.optional(),
  torqueRange: nonEmptyString.optional(),
  transmission: nonEmptyString.optional(),
  transmissionOptions: nonEmptyString.optional(),
  drive: nonEmptyString.optional(),
  steering: nonEmptyString.optional(),
  wheelbase: nonEmptyString.optional(),
  fuelOptions: nonEmptyString.optional(),
  emissionStandard: nonEmptyString.optional(),
  configuredTotalWeight: nonEmptyString.optional(),
  cargoLength: nonEmptyString.optional(),
  rearAxle: nonEmptyString.optional(),
}).passthrough()

const specificationGroupSchema = z.object({
  title: nonEmptyString,
  items: z.array(z.object({
    label: nonEmptyString,
    value: nonEmptyString,
    featured: z.boolean().optional(),
  }).passthrough()).min(1),
}).passthrough()

const fawTruckSourceSchema = z.object({
  slug: nonEmptyString,
  brand: nonEmptyString,
  brandSlug: nonEmptyString,
  name: nonEmptyString,
  model: nonEmptyString,
  productLine: nonEmptyString,
  category: z.enum(["Tractor", "Rigid Truck", "Dump Truck", "Special Purpose"]),
  truckTypeSlug: nonEmptyString,
  class: nullableString,
  shortDescription: nonEmptyString,
  featured: z.boolean(),
  active: z.boolean(),
  availabilityStatus: nonEmptyString,
  regionalAvailabilityNote: nonEmptyString,
  configurations: z.array(nonEmptyString),
  images: z.array(fawImageSourceSchema),
  imageStatus: nonEmptyString,
  keySpecs: fawKeySpecsSourceSchema,
  specificationGroups: z.array(specificationGroupSchema),
  applications: z.array(nonEmptyString),
  brochureUrl: z.url().nullable().optional(),
  seo: z.object({
    title: nonEmptyString.optional(),
    description: nonEmptyString.optional(),
  }).optional(),
  source: z.object({
    brandWebsite: z.url(),
    categoryUrl: z.url(),
    productUrl: z.url(),
    verifiedAt: nonEmptyString.refine(
      (value) => !Number.isNaN(new Date(value).valueOf()),
      "Use a valid verification date.",
    ),
  }).passthrough(),
  notes: nullableString,
}).passthrough()

type FawBrandSource = z.infer<typeof fawBrandSourceSchema>
type FawTruckSource = z.infer<typeof fawTruckSourceSchema>

const categoryTaxonomy: Record<FawTruckSource["category"], {
  vehicleFamily: string
  bodyType: string
  legacyTypeSlug: string
}> = {
  Tractor: { vehicleFamily: "Truck", bodyType: "Tractor Head", legacyTypeSlug: "tractor-head" },
  "Rigid Truck": { vehicleFamily: "Truck", bodyType: "Rigid Truck", legacyTypeSlug: "rigid-truck" },
  "Dump Truck": { vehicleFamily: "Truck", bodyType: "Dump Truck", legacyTypeSlug: "dump-truck" },
  "Special Purpose": {
    vehicleFamily: "Special Purpose Vehicle",
    bodyType: "Special Purpose Vehicle",
    legacyTypeSlug: "special-purpose",
  },
}

const keySpecLabels: Record<string, string> = {
  engine: "Engine",
  engineOptions: "Engine Options",
  displacement: "Displacement",
  engineDisplacement: "Engine Displacement",
  maximumPower: "Maximum Power",
  power: "Power",
  powerOptions: "Power Options",
  powerRange: "Power Range",
  maximumTorque: "Maximum Torque",
  torqueRange: "Torque Range",
  transmission: "Transmission",
  transmissionOptions: "Transmission Options",
  drive: "Drive",
  steering: "Steering",
  wheelbase: "Wheelbase",
  fuelOptions: "Fuel Options",
  emissionStandard: "Emission Standard",
  configuredTotalWeight: "Configured Total Weight",
  cargoLength: "Cargo Length",
  rearAxle: "Rear Axle",
}

function schemaIssues(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): ManufacturerImportIssue[] {
  return error.issues.map((issue) => ({
    severity: "error",
    field: issue.path.map(String).join(".") || "document",
    message: issue.message,
    reason: issue.message,
    code: "INVALID_SOURCE_SHAPE",
  }))
}

function warning(
  field: string,
  sourceValue: unknown,
  normalizedValue: unknown,
  message: string,
  code: string,
): ManufacturerImportIssue {
  return { severity: "warning", field, sourceValue, normalizedValue, message, reason: message, code }
}

function compact<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(Object.entries(value).filter(([, entry]) => entry !== undefined)) as T
}

function exactNumber(value: string | undefined, unit: string) {
  if (!value) return undefined
  const match = value.match(new RegExp(`^\\s*([\\d,.]+)\\s*${unit}\\s*$`, "i"))
  return match ? Number(match[1].replaceAll(",", "")) : undefined
}

function sourcePropulsion(record: FawTruckSource) {
  const source = [record.keySpecs.fuelOptions, ...record.configurations].filter(Boolean).join(" ").toLowerCase()
  const fuels = new Set<string>()
  if (source.includes("diesel")) fuels.add("Diesel")
  if (source.includes("cng")) fuels.add("CNG")
  if (source.includes("lng")) fuels.add("LNG")
  if (source.includes("natural gas")) fuels.add("Natural Gas")
  if (fuels.size > 1 || fuels.has("Natural Gas")) return "Multiple / Configurable"
  return [...fuels][0] || "Unknown"
}

function sourceApplicationTags(applications: string[]) {
  const source = applications.join(" ").toLowerCase()
  const tags: string[] = []
  if (/construction|concrete|sand and gravel|muck/.test(source)) tags.push("Construction")
  if (/mining/.test(source)) tags.push("Mining")
  if (/long-distance|long haul|road freight|heavy road transport/.test(source)) tags.push("Long Haul")
  if (/urban|last-mile|logistics|distribution|delivery|retail/.test(source)) tags.push("Urban Logistics")
  if (/sanitation|municipal|road sweeping|snow removal|water sprinkling/.test(source)) tags.push("Municipal")
  if (/garbage|waste/.test(source)) tags.push("Waste Collection")
  return [...new Set(tags)]
}

function preservedSpecificationGroups(record: FawTruckSource) {
  const groups = record.specificationGroups.map((group) => ({
    title: group.title,
    items: group.items.map(({ label, value, featured }) => ({ label, value, ...(featured === undefined ? {} : { featured }) })),
  }))
  const representedValues = new Set(groups.flatMap((group) => group.items.map((item) => item.value.trim().toLowerCase())))
  const additionalItems = Object.entries(record.keySpecs).flatMap(([key, value]) => {
    if (typeof value !== "string" || representedValues.has(value.trim().toLowerCase())) return []
    return [{ label: keySpecLabels[key] || key, value }]
  })
  return additionalItems.length ? [...groups, { title: "Source Summary", items: additionalItems }] : groups
}

function normalizeFawSourceRecord(record: FawTruckSource, brand: FawBrandSource) {
  const taxonomy = categoryTaxonomy[record.category]
  const propulsion = sourcePropulsion(record)
  const reviewedDutyClasses: Record<string, string> = {
    "NEW J5P Tractor": "Heavy Duty",
    "NEW J5M Tractor": "Medium Duty",
    "J5P Tractor": "Heavy Duty",
  }
  const dutyClass = record.class || reviewedDutyClasses[record.model]
  const issues: ManufacturerImportIssue[] = [warning(
    "source.dataWarnings",
    record.regionalAvailabilityNote,
    record.regionalAvailabilityNote,
    "Regional availability and configuration warning retained for manual review.",
    "REGIONAL_CONFIGURATION_WARNING",
  )]
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
  ]

  if (!record.class && dutyClass) {
    issues.push(warning(
      "dutyClass",
      record.class,
      dutyClass,
      "Duty class was resolved from the source model's engine, axle/configuration, and stated application evidence.",
      "SOURCE_DUTY_CLASS_RESOLVED",
    ))
  }
  if (record.productLine === "V Series" && record.category === "Tractor") {
    issues.push(warning(
      "productLine",
      record.productLine,
      record.model,
      "The shared V Series page family contains separately named J5P/J5M tractor variants; retain this source identity and review the variants together before promotion.",
      "SOURCE_FAMILY_VARIANT_REVIEW",
    ))
  }
  if (!record.images.some((image) => image.url && existingLocalImagePath(image.localPathSuggested))) {
    issues.push(warning(
      "images",
      record.imageStatus,
      null,
      "No validated local manufacturer image is available; the frontend photography-unavailable fallback will be used.",
      "LOCAL_IMAGE_FALLBACK_REQUIRED",
    ))
  }
  if (record.notes) {
    issues.push(warning(
      "source.dataWarnings",
      record.notes,
      record.notes,
      "Manufacturer source note retained for manual QA.",
      "MANUFACTURER_SOURCE_WARNING",
    ))
  }

  const keySpecs = compact({
    engine: record.keySpecs.engine || record.keySpecs.engineOptions,
    engineDisplacement: record.keySpecs.displacement || record.keySpecs.engineDisplacement,
    horsepower: exactNumber(record.keySpecs.power, "hp"),
    powerPs: exactNumber(record.keySpecs.maximumPower, "PS"),
    torqueNm: exactNumber(record.keySpecs.maximumTorque, "Nm"),
    transmission: record.keySpecs.transmission || record.keySpecs.transmissionOptions,
    drive: record.keySpecs.drive,
    wheelbaseMm: exactNumber(record.keySpecs.wheelbase, "mm"),
    fuelType: record.keySpecs.fuelOptions,
    emissionStandard: record.keySpecs.emissionStandard,
    rearBodyLength: record.keySpecs.cargoLength,
  })
  const dataWarnings = [record.regionalAvailabilityNote, ...(record.notes ? [record.notes] : [])]
  const input: RawVehicleImport = {
    slug: record.slug,
    brandSlug: record.brandSlug,
    name: record.name,
    model: record.model,
    vehicleFamily: normalizeTaxonomyValue("vehicleFamily", taxonomy.vehicleFamily) || taxonomy.vehicleFamily,
    bodyType: normalizeTaxonomyValue("bodyType", taxonomy.bodyType) || taxonomy.bodyType,
    ...(dutyClass ? { dutyClass: normalizeTaxonomyValue("dutyClass", dutyClass) || dutyClass } : {}),
    propulsion: normalizeTaxonomyValue("propulsion", propulsion) || propulsion,
    applicationTags: sourceApplicationTags(record.applications),
    shortDescription: record.shortDescription,
    images: record.images.flatMap((image) => {
      const localPath = existingLocalImagePath(image.localPathSuggested)
      return image.url && localPath ? [{
        url: localPath,
        alt: image.alt,
        isPrimary: false,
        order: 0,
        sourceUrl: image.url,
        sourcePage: record.source.productUrl,
        storageProvider: "local" as const,
        suggestedLocalPath: localPath,
        status: "local-asset-ready",
      }] : []
    }).map((image, index) => ({ ...image, isPrimary: index === 0, order: index + 1 })),
    keySpecs,
    specificationGroups: preservedSpecificationGroups(record),
    applications: record.applications,
    configurations: record.configurations,
    ...(record.brochureUrl ? {
      brochure: { url: record.brochureUrl, title: `${record.model} brochure source`, source: record.source.brandWebsite },
      brochureUrl: record.brochureUrl,
    } : {}),
    source: {
      manufacturer: brand.name,
      website: brand.officialWebsite,
      productUrl: record.source.productUrl,
      verifiedAt: record.source.verifiedAt,
      notes: record.regionalAvailabilityNote,
      dataWarnings,
    },
    seo: record.seo,
    featured: record.featured,
    active: false,
    displayOrder: 0,
  }
  return { input, legacyTypeSlug: taxonomy.legacyTypeSlug, decisions, issues }
}

export const fawAdapter: ManufacturerAdapter = {
  parseBrand(raw) {
    const parsed = fawBrandSourceSchema.safeParse(raw)
    return parsed.success
      ? { success: true, data: parsed.data }
      : { success: false, issues: schemaIssues(parsed.error) }
  },
  normalizeVehicle(raw, brand: ManufacturerBrandSource) {
    const parsed = fawTruckSourceSchema.safeParse(raw)
    if (!parsed.success) {
      const identity = raw && typeof raw === "object" ? raw as Record<string, unknown> : {}
      return {
        success: false,
        model: typeof identity.model === "string" ? identity.model : undefined,
        slug: typeof identity.slug === "string" ? identity.slug : undefined,
        issues: schemaIssues(parsed.error),
      }
    }
    return { success: true, ...normalizeFawSourceRecord(parsed.data, brand as FawBrandSource) }
  },
}
