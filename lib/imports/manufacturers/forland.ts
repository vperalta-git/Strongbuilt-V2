import {
  createPreparedManufacturerAdapter,
  preparedIssue,
  type PreparedTruckSource,
} from "@/lib/imports/manufacturers/prepared"

function dutyClass(record: PreparedTruckSource) {
  if (["Light Duty", "Heavy Duty", "Special Purpose"].includes(record.class || "")) return record.class || undefined
  if (record.class?.includes(" / ")) return "Multiple / Configurable"
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
    const configurableDuty = Boolean(record.class?.includes(" / "))
    return {
      ...mapping,
      dutyClass: dutyClass(record),
      issues: configurableDuty ? [preparedIssue(
        "warning",
        "dutyClass",
        "The official source spans more than one duty class; the configurable range is preserved without inventing a single class.",
        "CONFIGURABLE_DUTY_CLASS_PRESERVED",
        record.class,
        "Multiple / Configurable",
      )] : [],
    }
  },
})
