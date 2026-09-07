import {
  isuzuBrandSourceSchema,
  isuzuTruckSourceSchema,
  normalizeIsuzuSourceRecord,
  type IsuzuBrandSource,
} from "@/lib/imports/isuzu"
import type { ManufacturerAdapter, ManufacturerBrandSource, ManufacturerImportIssue } from "@/lib/imports/core/types"

function schemaIssues(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): ManufacturerImportIssue[] {
  return error.issues.map((issue) => ({
    severity: "error",
    field: issue.path.map(String).join(".") || "document",
    message: issue.message,
    reason: issue.message,
    code: "INVALID_SOURCE_SHAPE",
  }))
}

export const isuzuAdapter: ManufacturerAdapter = {
  parseBrand(raw) {
    const parsed = isuzuBrandSourceSchema.safeParse(raw)
    return parsed.success
      ? { success: true, data: parsed.data }
      : { success: false, issues: schemaIssues(parsed.error) }
  },
  normalizeVehicle(raw, brand: ManufacturerBrandSource) {
    const parsed = isuzuTruckSourceSchema.safeParse(raw)
    if (!parsed.success) {
      const identity = raw && typeof raw === "object" ? raw as Record<string, unknown> : {}
      return {
        success: false,
        model: typeof identity.model === "string" ? identity.model : undefined,
        slug: typeof identity.slug === "string" ? identity.slug : undefined,
        issues: schemaIssues(parsed.error),
      }
    }
    const normalized = normalizeIsuzuSourceRecord(parsed.data, brand as IsuzuBrandSource)
    return { success: true, ...normalized }
  },
}
