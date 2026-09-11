import {
  createPreparedManufacturerAdapter,
  preparedIssue,
} from "@/lib/imports/manufacturers/prepared"

export const shacmanAdapter = createPreparedManufacturerAdapter({
  normalizeTaxonomy(record) {
    if (record.category === "Heavy Truck Platform") {
      return {
        vehicleFamily: "Truck",
        bodyType: "Configurable Truck Platform",
        dutyClass: "Heavy Duty",
        legacyTypeSlug: "special-purpose",
        issues: [preparedIssue(
          "warning",
          "bodyType",
          "The official source is a configurable tractor, dump, and cargo platform family; the family is preserved without inventing individual variants.",
          "CONFIGURABLE_PLATFORM_PRESERVED",
          record.configurations,
          "Configurable Truck Platform",
        )],
      }
    }
    if (record.category === "Medium / Heavy Truck Platform") {
      return {
        vehicleFamily: "Truck",
        bodyType: "Configurable Truck Platform",
        dutyClass: "Multiple / Configurable",
        legacyTypeSlug: "special-purpose",
        issues: [preparedIssue(
          "warning",
          "dutyClass",
          "The official platform spans medium- and heavy-duty configurations; the mixed duty class is preserved explicitly.",
          "CONFIGURABLE_DUTY_CLASS_PRESERVED",
          record.class,
          "Multiple / Configurable",
        )],
      }
    }
    if (record.category === "Electric Truck") {
      return {
        vehicleFamily: "Truck",
        bodyType: "Configurable Truck Platform",
        dutyClass: "Multiple / Configurable",
        propulsion: "Battery Electric",
        legacyTypeSlug: "special-purpose",
        issues: [preparedIssue(
          "warning",
          "bodyType",
          "The official source describes a battery-electric commercial platform without a single body configuration; the platform identity is preserved.",
          "CONFIGURABLE_PLATFORM_PRESERVED",
          record.category,
          "Configurable Truck Platform",
        )],
      }
    }
    if (record.category === "Port Tractor") {
      return {
        vehicleFamily: "Truck",
        bodyType: "Tractor Head",
        dutyClass: "Heavy Duty",
        legacyTypeSlug: "tractor-head",
      }
    }
    return {
      vehicleFamily: "Special Purpose Vehicle",
      bodyType: "Special Purpose Vehicle",
      dutyClass: "Special Purpose",
      legacyTypeSlug: "special-purpose",
    }
  },
})
