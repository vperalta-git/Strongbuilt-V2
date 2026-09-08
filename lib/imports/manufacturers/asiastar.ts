import { createPreparedManufacturerAdapter } from "@/lib/imports/manufacturers/prepared"

export const asiastarAdapter = createPreparedManufacturerAdapter({
  normalizeTaxonomy(record) {
    const mapping = record.category === "Coach"
      ? { vehicleFamily: "Coach", bodyType: "Coach" }
      : record.category === "Intercity Bus"
        ? { vehicleFamily: "Bus", bodyType: "Intercity Bus" }
        : { vehicleFamily: "Bus", bodyType: "City Bus" }
    return { ...mapping, dutyClass: "Passenger", legacyTypeSlug: "bus" }
  },
})
