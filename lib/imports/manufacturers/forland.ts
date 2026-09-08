import {
  createPreparedManufacturerAdapter,
  preparedIssue,
  type PreparedTruckSource,
} from "@/lib/imports/manufacturers/prepared"

function dutyClass(record: PreparedTruckSource) {
  if (["Light Duty", "Heavy Duty", "Special Purpose"].includes(record.class || "")) return record.class || undefined
  return undefined
}

export const forlandAdapter = createPreparedManufacturerAdapter({
  normalizeTaxonomy(record) {
    const mappings: Record<string, { vehicleFamily: string; bodyType: string; legacyTypeSlug: string }> = {
      "Mini Truck": { vehicleFamily: "Truck", bodyType: "Mini Truck", legacyTypeSlug: "mini-truck" },
      "Light Truck": { vehicleFamily: "Truck", bodyType: "Rigid Truck", legacyTypeSlug: "light-truck" },
      "Heavy-duty Truck": { vehicleFamily: "Truck", bodyType: "Rigid Truck", legacyTypeSlug: "heavy-duty-truck" },
      "Dump Truck": { vehicleFamily: "Truck", bodyType: "Dump Truck", legacyTypeSlug: "dump-truck" },
      "Special Vehicle": {
        vehicleFamily: "Special Purpose Vehicle",
        bodyType: record.model === "H7 Compactor" ? "Garbage Truck" : "Special Purpose Vehicle",
        legacyTypeSlug: "special-purpose",
      },
    }
    const mapping = mappings[record.category] || {
      vehicleFamily: "Truck",
      bodyType: record.category,
      legacyTypeSlug: record.truckTypeSlug,
    }
    const ambiguousDuty = Boolean(record.class?.includes(" / "))
    return {
      ...mapping,
      dutyClass: dutyClass(record),
      issues: ambiguousDuty ? [preparedIssue(
        "error",
        "dutyClass",
        "The source spans more than one canonical duty class; select an approved configuration/class before promotion.",
        "AMBIGUOUS_DUTY_CLASS",
        record.class,
        null,
      )] : [],
    }
  },
})
