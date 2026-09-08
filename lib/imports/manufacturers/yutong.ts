import { createPreparedManufacturerAdapter } from "@/lib/imports/manufacturers/prepared"

const busTypes = new Set(["hybrid-city-bus", "electric-city-bus", "electric-articulated-bus", "electric-double-decker-bus", "city-bus"])
const coachTypes = new Set(["electric-coach", "coach"])
const apronTypes = new Set(["apron-bus", "electric-apron-bus"])
const medicalTypes = new Set(["blood-collection-vehicle", "medical-vehicle"])
const emergencyTypes = new Set(["ambulance"])

export const yutongAdapter = createPreparedManufacturerAdapter({
  normalizeTaxonomy(record) {
    if (busTypes.has(record.truckTypeSlug)) {
      return { vehicleFamily: "Bus", bodyType: "City Bus", dutyClass: "Passenger", legacyTypeSlug: "bus" }
    }
    if (coachTypes.has(record.truckTypeSlug)) {
      return { vehicleFamily: "Coach", bodyType: "Coach", dutyClass: "Passenger", legacyTypeSlug: "bus" }
    }
    if (apronTypes.has(record.truckTypeSlug)) {
      return { vehicleFamily: "Bus", bodyType: "Apron Bus", dutyClass: "Passenger", legacyTypeSlug: "bus" }
    }
    if (medicalTypes.has(record.truckTypeSlug)) {
      return { vehicleFamily: "Special Purpose Vehicle", bodyType: "Medical Vehicle", dutyClass: "Special Purpose", legacyTypeSlug: "special-purpose" }
    }
    if (emergencyTypes.has(record.truckTypeSlug)) {
      return { vehicleFamily: "Special Purpose Vehicle", bodyType: "Emergency Vehicle", dutyClass: "Special Purpose", legacyTypeSlug: "special-purpose" }
    }
    if (record.truckTypeSlug === "police-special-vehicle") {
      return { vehicleFamily: "Trailer", bodyType: "Trailer", dutyClass: "Trailer", legacyTypeSlug: "trailer" }
    }
    return {
      vehicleFamily: "Special Purpose Vehicle",
      bodyType: "Special Purpose Vehicle",
      dutyClass: "Special Purpose",
      legacyTypeSlug: "special-purpose",
    }
  },
})
