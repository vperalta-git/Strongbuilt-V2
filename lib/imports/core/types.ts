import type { VehicleNormalizationDecision } from "@/lib/domain/vehicle"
import type { RawVehicleImport, VehicleImportIssue } from "@/lib/validation/vehicle-import"

export type ManufacturerImportIssue = VehicleImportIssue & {
  sourceValue?: unknown
  normalizedValue?: unknown
  reason?: string
}

export type ManufacturerBrandSource = {
  name: string
  slug: string
  aliases?: string[]
  [key: string]: unknown
}

export type ManufacturerNormalizationResult = {
  input: RawVehicleImport
  legacyTypeSlug: string
  decisions: VehicleNormalizationDecision[]
  issues: ManufacturerImportIssue[]
}

export type ManufacturerAdapter = {
  parseBrand(raw: unknown):
    | { success: true; data: ManufacturerBrandSource }
    | { success: false; issues: ManufacturerImportIssue[] }
  normalizeVehicle(raw: unknown, brand: ManufacturerBrandSource):
    | ({ success: true } & ManufacturerNormalizationResult)
    | { success: false; model?: string; slug?: string; issues: ManufacturerImportIssue[] }
}

export type ManufacturerConfiguration = {
  slug: string
  displayName: string
  sourceFiles: { brands: string; vehicles: string }
  brandAliases: string[]
  defaultTaxonomyHints: Record<string, string>
  legacyTypeAliases: Record<string, string>
  image: { localAssetDirectory: string; allowRemoteSourceAsProvenance: boolean }
  knownSourceWarnings: string[]
  allowedVehicleFamilies: string[]
  importVersion: number
  reviewedBatches?: Record<string, readonly string[]>
  adapter: ManufacturerAdapter
}
