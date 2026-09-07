import type { ManufacturerAdapter, ManufacturerBrandSource, ManufacturerImportIssue } from "@/lib/imports/core/types"
import { rawVehicleImportSchema } from "@/lib/validation/vehicle-import"

function issue(message: string, field = "document"): ManufacturerImportIssue {
  return { severity: "error", field, message, reason: message, code: "INVALID_SOURCE_SHAPE" }
}

/**
 * Conservative adapter used by manufacturer-specific modules until their raw
 * source contracts are supplied. It accepts canonical import records only; it
 * never guesses at unknown manufacturer fields.
 */
export function createCanonicalManufacturerAdapter(defaultLegacyTypeSlug: string): ManufacturerAdapter {
  return {
    parseBrand(raw) {
      if (!raw || typeof raw !== "object") return { success: false, issues: [issue("Brand source must be an object.")] }
      const value = raw as Record<string, unknown>
      if (typeof value.name !== "string" || typeof value.slug !== "string") {
        return { success: false, issues: [issue("Brand source requires name and slug.")] }
      }
      return { success: true, data: value as ManufacturerBrandSource }
    },
    normalizeVehicle(raw) {
      const parsed = rawVehicleImportSchema.safeParse(raw)
      if (!parsed.success) {
        const value = raw && typeof raw === "object" ? raw as Record<string, unknown> : {}
        return {
          success: false,
          model: typeof value.model === "string" ? value.model : undefined,
          slug: typeof value.slug === "string" ? value.slug : undefined,
          issues: parsed.error.issues.map((entry) => issue(entry.message, entry.path.map(String).join(".") || "document")),
        }
      }
      return {
        success: true,
        input: parsed.data,
        legacyTypeSlug: typeof (raw as Record<string, unknown>).legacyTypeSlug === "string"
          ? String((raw as Record<string, unknown>).legacyTypeSlug)
          : defaultLegacyTypeSlug,
        decisions: [],
        issues: [],
      }
    },
  }
}
