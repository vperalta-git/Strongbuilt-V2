import {
  createPreparedManufacturerAdapter,
  preparedIssue,
} from "@/lib/imports/manufacturers/prepared"

export const shacmanAdapter = createPreparedManufacturerAdapter({
  normalizeTaxonomy(record) {
    if (record.category === "Heavy Truck Platform") {
      return {
        vehicleFamily: "Truck",
        bodyType: record.category,
        dutyClass: "Heavy Duty",
        legacyTypeSlug: record.truckTypeSlug,
        issues: [preparedIssue(
          "error",
          "bodyType",
          "This platform combines tractor, dump, and cargo configurations; a canonical body type and safe legacy type require reviewed variant separation.",
          "AMBIGUOUS_BODY_TYPE",
          record.configurations,
          null,
        )],
      }
    }
    if (record.category === "Medium / Heavy Truck Platform") {
      return {
        vehicleFamily: "Truck",
        bodyType: "Rigid Truck",
        legacyTypeSlug: "rigid-truck",
        issues: [preparedIssue(
          "error",
          "dutyClass",
          "The source combines medium- and heavy-duty variants; select a reviewed duty class before promotion.",
          "AMBIGUOUS_DUTY_CLASS",
          record.class,
          null,
        )],
      }
    }
    if (record.category === "Electric Truck") {
      return {
        vehicleFamily: "Truck",
        bodyType: record.category,
        propulsion: "Battery Electric",
        legacyTypeSlug: record.truckTypeSlug,
        issues: [preparedIssue(
          "error",
          "bodyType",
          "Electric describes propulsion, not body configuration; a reviewed body and legacy type are required.",
          "AMBIGUOUS_BODY_TYPE",
          record.category,
          null,
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
