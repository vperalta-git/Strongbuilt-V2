import {
  createPreparedManufacturerAdapter,
  preparedIssue,
} from "@/lib/imports/manufacturers/prepared"

const typeMappings: Record<string, { vehicleFamily: string; bodyType: string; legacyTypeSlug: string }> = {
  "dump-truck": { vehicleFamily: "Truck", bodyType: "Dump Truck", legacyTypeSlug: "dump-truck" },
  "tractor-head": { vehicleFamily: "Truck", bodyType: "Tractor Head", legacyTypeSlug: "tractor-head" },
  "rigid-truck": { vehicleFamily: "Truck", bodyType: "Rigid Truck", legacyTypeSlug: "rigid-truck" },
  "box-van": { vehicleFamily: "Truck", bodyType: "Box Van", legacyTypeSlug: "box-van" },
  "stake-truck": { vehicleFamily: "Truck", bodyType: "Cargo Truck", legacyTypeSlug: "stake-truck" },
  "refrigerated-truck": { vehicleFamily: "Truck", bodyType: "Refrigerated Truck", legacyTypeSlug: "refrigerated-truck" },
  "wing-van": { vehicleFamily: "Truck", bodyType: "Wing Van", legacyTypeSlug: "wing-van" },
  "water-tanker": { vehicleFamily: "Special Purpose Vehicle", bodyType: "Water Tanker", legacyTypeSlug: "water-tanker" },
  tanker: { vehicleFamily: "Special Purpose Vehicle", bodyType: "Oil Tanker", legacyTypeSlug: "tanker" },
  "mixer-truck": { vehicleFamily: "Special Purpose Vehicle", bodyType: "Mixer Truck", legacyTypeSlug: "mixer-truck" },
  "special-purpose": { vehicleFamily: "Special Purpose Vehicle", bodyType: "Special Purpose Vehicle", legacyTypeSlug: "special-purpose" },
  "garbage-truck": { vehicleFamily: "Special Purpose Vehicle", bodyType: "Garbage Truck", legacyTypeSlug: "garbage-truck" },
  "crane-truck": { vehicleFamily: "Special Purpose Vehicle", bodyType: "Crane Truck", legacyTypeSlug: "crane-truck" },
  "dump-trailer": { vehicleFamily: "Trailer", bodyType: "Semi Trailer", legacyTypeSlug: "dump-trailer" },
  "tanker-trailer": { vehicleFamily: "Trailer", bodyType: "Semi Trailer", legacyTypeSlug: "tanker-trailer" },
  "semi-trailer": { vehicleFamily: "Trailer", bodyType: "Semi Trailer", legacyTypeSlug: "semi-trailer" },
  "flatbed-trailer": { vehicleFamily: "Trailer", bodyType: "Flatbed Trailer", legacyTypeSlug: "flatbed-trailer" },
  "lowbed-trailer": { vehicleFamily: "Trailer", bodyType: "Low Bed Trailer", legacyTypeSlug: "lowbed-trailer" },
  "electric-truck": { vehicleFamily: "Truck", bodyType: "Rigid Truck", legacyTypeSlug: "electric-truck" },
  "electric-dump-truck": { vehicleFamily: "Truck", bodyType: "Dump Truck", legacyTypeSlug: "electric-dump-truck" },
  "electric-tractor": { vehicleFamily: "Truck", bodyType: "Tractor Head", legacyTypeSlug: "electric-tractor" },
}

export const sinotrukAdapter = createPreparedManufacturerAdapter({
  normalizeTaxonomy(record) {
    const mapping = typeMappings[record.truckTypeSlug] || {
      vehicleFamily: "Truck",
      bodyType: record.category,
      legacyTypeSlug: record.truckTypeSlug,
    }
    const knownDuty: Record<string, string> = {
      "Heavy Duty": "Heavy Duty",
      "Light Duty": "Light Duty",
      "Special Purpose": "Special Purpose",
      Trailer: "Trailer",
    }
    const newEnergyDuty: Record<string, string> = {
      "Electric Light Truck": "Light Duty",
      "Electric Dump Truck": "Heavy Duty",
      "Electric Tractor Truck": "Heavy Duty",
      "Electric Terminal / Dock Tractor": "Special Purpose",
    }
    const dutyClass = newEnergyDuty[record.category] || (record.class ? knownDuty[record.class] : undefined)
    const issues = !dutyClass && record.class ? [preparedIssue(
      "warning",
      "dutyClass",
      "The source class describes new-energy/terminal use rather than vehicle weight; duty class remains unset.",
      "SOURCE_DUTY_CLASS_UNRESOLVED",
      record.class,
      null,
    )] : []
    return {
      ...mapping,
      dutyClass,
      ...(record.category.startsWith("Electric") ? { propulsion: "Battery Electric" } : {}),
      issues,
    }
  },
})
