import { createPreparedManufacturerAdapter } from "@/lib/imports/manufacturers/prepared"

const preparedAsiastarAdapter = createPreparedManufacturerAdapter({
  normalizeTaxonomy(record) {
    const mapping = record.category === "Coach"
      ? { vehicleFamily: "Coach", bodyType: "Coach" }
      : record.category === "Intercity Bus"
        ? { vehicleFamily: "Bus", bodyType: "Intercity Bus" }
        : { vehicleFamily: "Bus", bodyType: "City Bus" }
    return { ...mapping, dutyClass: "Passenger", legacyTypeSlug: "bus" }
  },
})

export const asiastarAdapter = {
  ...preparedAsiastarAdapter,
  normalizeVehicle(...args: Parameters<typeof preparedAsiastarAdapter.normalizeVehicle>) {
    const result = preparedAsiastarAdapter.normalizeVehicle(...args)
    if (!result.success) return result
    return {
      ...result,
      input: {
        ...result.input,
        images: result.input.images.map((image) => ({
          ...image,
          suggestedLocalPath: image.suggestedLocalPath?.replace(/\.[a-z0-9]+$/i, ".webp"),
        })),
      },
    }
  },
}
