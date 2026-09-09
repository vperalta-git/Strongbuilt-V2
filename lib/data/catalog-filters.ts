import type { Truck, TruckBodyType } from "@/types/truck"

const legacyBodyTypes: readonly TruckBodyType[] = [
  "Cargo",
  "Dump Truck",
  "Tractor Head",
  "Bus",
  "Trailer",
  "Specialized / Custom",
]

function normalized(value: string) {
  return value.trim().toLowerCase()
}

export function getCatalogBodyType(truck: Truck) {
  return truck.catalogTaxonomy?.bodyType || truck.bodyType
}

export function getCatalogBodyTypes(trucks: Truck[]) {
  return [...new Set(trucks.map(getCatalogBodyType))].sort()
}

/**
 * Canonical values match first. Legacy values remain valid URL filters and match
 * the compatibility projection, so an existing `?type=Bus` link stays broad.
 */
export function matchesCatalogBodyType(truck: Truck, selectedBodyType: string) {
  if (!selectedBodyType) return true
  const selected = normalized(selectedBodyType)
  if (normalized(getCatalogBodyType(truck)) === selected) return true

  const legacySelection = legacyBodyTypes.find((value) => normalized(value) === selected)
  return Boolean(legacySelection && normalized(truck.bodyType) === selected)
}

export function catalogSearchText(truck: Truck) {
  return [
    truck.brand,
    truck.model,
    getCatalogBodyType(truck),
    truck.bodyType,
    truck.category,
    truck.catalogTaxonomy?.vehicleFamily,
    truck.catalogTaxonomy?.dutyClass,
    truck.catalogTaxonomy?.propulsion,
    truck.shortDescription,
    ...truck.applications,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
}
