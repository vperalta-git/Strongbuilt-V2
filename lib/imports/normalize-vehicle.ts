import type { VehicleNormalizationDecision } from "@/lib/domain/vehicle"
import {
  normalizeTaxonomyValue,
  type VehicleApplicationTag,
  type VehicleBodyType,
  type VehicleDutyClass,
  type VehicleFamily,
  type VehiclePropulsion,
} from "@/lib/domain/vehicle-taxonomy"
import {
  rawVehicleImportSchema,
  type RawVehicleImport,
  type VehicleImportIssue,
} from "@/lib/validation/vehicle-import"

export type NormalizedVehicleImport = Omit<
  RawVehicleImport,
  "vehicleFamily" | "bodyType" | "dutyClass" | "propulsion" | "applicationTags" | "configurations"
> & {
  vehicleFamily: VehicleFamily
  bodyType: VehicleBodyType
  dutyClass?: VehicleDutyClass
  propulsion: VehiclePropulsion
  applicationTags: VehicleApplicationTag[]
  configurations?: string[]
}

export type StagedVehicleImport = {
  index: number
  raw: unknown
  normalized?: NormalizedVehicleImport
  normalizationDecisions: VehicleNormalizationDecision[]
  issues: VehicleImportIssue[]
  status: "ready" | "needs-review" | "rejected"
}

export type VehicleImportQaReport = {
  total: number
  ready: number
  needsReview: number
  rejected: number
  records: StagedVehicleImport[]
}

export type VehicleImportContext = {
  knownBrandSlugs: Iterable<string>
}

function error(field: string, message: string, code: string): VehicleImportIssue {
  return { severity: "error", field, message, code }
}

function warning(field: string, message: string, code: string): VehicleImportIssue {
  return { severity: "warning", field, message, code }
}

function normalizeField<T>(
  field: "vehicleFamily" | "bodyType" | "dutyClass" | "propulsion" | "applicationTag",
  rawValue: string,
  decisions: VehicleNormalizationDecision[],
) {
  const value = normalizeTaxonomyValue(field, rawValue) as T | undefined
  if (value !== undefined && value !== rawValue) {
    decisions.push({
      field,
      rawValue,
      normalizedValue: value,
      reason: "Matched an approved taxonomy alias or normalized capitalization.",
    })
  }
  return value
}

type ImportConfiguration = NonNullable<RawVehicleImport["configurations"]>[number]

function configurationName(configuration: ImportConfiguration) {
  return typeof configuration === "string" ? configuration : configuration.name
}

function findConfigurationIssues(configurations: RawVehicleImport["configurations"] = []) {
  const issues: VehicleImportIssue[] = []
  const grouped = new Map<string, unknown[]>()
  for (const configuration of configurations) {
    const name = configurationName(configuration).trim().toLowerCase()
    grouped.set(name, [...(grouped.get(name) ?? []), configuration])
  }
  for (const [name, values] of grouped) {
    if (values.length < 2) continue
    const distinct = new Set(values.map((value) => JSON.stringify(value)))
    issues.push(
      distinct.size > 1
        ? warning("configurations", `Configuration "${name}" has conflicting source values that require review.`, "CONFLICTING_CONFIGURATION")
        : warning("configurations", `Configuration "${name}" is duplicated.`, "DUPLICATE_CONFIGURATION"),
    )
  }
  return issues
}

function parseRecord(raw: unknown, index: number, knownBrands: Set<string>): StagedVehicleImport {
  const parsed = rawVehicleImportSchema.safeParse(raw)
  if (!parsed.success) {
    return {
      index,
      raw,
      normalizationDecisions: [],
      issues: parsed.error.issues.map((issue) => error(
        issue.path.join(".") || "document",
        issue.message,
        "INVALID_SOURCE_SHAPE",
      )),
      status: "rejected",
    }
  }

  const input = parsed.data
  const decisions: VehicleNormalizationDecision[] = []
  const issues = findConfigurationIssues(input.configurations)
  const vehicleFamily = normalizeField<VehicleFamily>("vehicleFamily", input.vehicleFamily, decisions)
  const bodyType = normalizeField<VehicleBodyType>("bodyType", input.bodyType, decisions)
  const dutyClass = input.dutyClass
    ? normalizeField<VehicleDutyClass>("dutyClass", input.dutyClass, decisions)
    : undefined
  const propulsion = normalizeField<VehiclePropulsion>("propulsion", input.propulsion, decisions)
  const applicationTags = input.applicationTags.flatMap((tag) => {
    const normalized = normalizeField<VehicleApplicationTag>("applicationTag", tag, decisions)
    if (!normalized) issues.push(error("applicationTags", `Unsupported application tag: ${tag}.`, "UNSUPPORTED_TAXONOMY"))
    return normalized ? [normalized] : []
  })

  if (!knownBrands.has(input.brandSlug.toLowerCase())) {
    issues.push(error("brandSlug", `Unknown brand slug: ${input.brandSlug}.`, "UNKNOWN_BRAND"))
  }
  if (!vehicleFamily) issues.push(error("vehicleFamily", `Unsupported vehicle family: ${input.vehicleFamily}.`, "UNSUPPORTED_TAXONOMY"))
  if (!bodyType) issues.push(error("bodyType", `Unsupported body type: ${input.bodyType}.`, "UNSUPPORTED_TAXONOMY"))
  if (input.dutyClass && !dutyClass) issues.push(error("dutyClass", `Unsupported duty class: ${input.dutyClass}.`, "UNSUPPORTED_TAXONOMY"))
  if (!propulsion) issues.push(error("propulsion", `Unsupported propulsion: ${input.propulsion}.`, "UNSUPPORTED_TAXONOMY"))

  const normalized = vehicleFamily && bodyType && propulsion
    ? {
        ...input,
        vehicleFamily,
        bodyType,
        dutyClass,
        propulsion,
        applicationTags,
        configurations: input.configurations?.map(configurationName),
      }
    : undefined
  const status = issues.some((issue) => issue.severity === "error")
    ? "rejected"
    : issues.length || decisions.length
      ? "needs-review"
      : "ready"

  return { index, raw, normalized, normalizationDecisions: decisions, issues, status }
}

function addCrossRecordIssues(records: StagedVehicleImport[]) {
  const slugs = new Map<string, StagedVehicleImport[]>()
  const products = new Map<string, StagedVehicleImport[]>()

  for (const record of records) {
    if (!record.normalized) continue
    const slug = record.normalized.slug.toLowerCase()
    slugs.set(slug, [...(slugs.get(slug) ?? []), record])
    const productKey = `${record.normalized.brandSlug.toLowerCase()}::${(record.normalized.model || record.normalized.name).trim().toLowerCase()}`
    products.set(productKey, [...(products.get(productKey) ?? []), record])
  }

  for (const duplicates of slugs.values()) {
    if (duplicates.length < 2) continue
    for (const record of duplicates) {
      record.issues.push(error("slug", `Duplicate slug: ${record.normalized?.slug}.`, "DUPLICATE_SLUG"))
      record.status = "rejected"
    }
  }
  for (const duplicates of products.values()) {
    if (duplicates.length < 2) continue
    for (const record of duplicates) {
      if (record.issues.some((issue) => issue.code === "DUPLICATE_SLUG")) continue
      record.issues.push(warning("model", "Likely duplicate product for the same brand and model.", "LIKELY_DUPLICATE_PRODUCT"))
      if (record.status === "ready") record.status = "needs-review"
    }
  }
}

export function stageVehicleImports(rawRecords: unknown[], context: VehicleImportContext): VehicleImportQaReport {
  const knownBrands = new Set([...context.knownBrandSlugs].map((slug) => slug.trim().toLowerCase()))
  const records = rawRecords.map((raw, index) => parseRecord(raw, index, knownBrands))
  addCrossRecordIssues(records)
  return {
    total: records.length,
    ready: records.filter((record) => record.status === "ready").length,
    needsReview: records.filter((record) => record.status === "needs-review").length,
    rejected: records.filter((record) => record.status === "rejected").length,
    records,
  }
}
