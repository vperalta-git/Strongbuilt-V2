export const vehicleFamilies = [
  "Truck",
  "Bus",
  "Coach",
  "Trailer",
  "PUV",
  "Special Purpose Vehicle",
] as const

export const vehicleBodyTypes = [
  "Mini Truck",
  "Cargo Truck",
  "Rigid Truck",
  "Dump Truck",
  "Tractor Head",
  "Box Van",
  "Wing Van",
  "Refrigerated Truck",
  "Mixer Truck",
  "Water Tanker",
  "Oil Tanker",
  "Garbage Truck",
  "Crane Truck",
  "Bus",
  "City Bus",
  "Intercity Bus",
  "Coach",
  "Apron Bus",
  "Trailer",
  "Semi Trailer",
  "Flatbed Trailer",
  "Low Bed Trailer",
  "Medical Vehicle",
  "Emergency Vehicle",
  "Municipal Vehicle",
  "Special Purpose Vehicle",
] as const

export const vehicleDutyClasses = [
  "Mini",
  "Light Duty",
  "Medium Duty",
  "Heavy Duty",
  "Passenger",
  "Trailer",
  "Special Purpose",
] as const

export const vehiclePropulsions = [
  "Diesel",
  "Gasoline",
  "CNG",
  "LNG",
  "Hybrid",
  "Battery Electric",
  "Multiple / Configurable",
  "Unknown",
] as const

export const vehicleApplicationTags = [
  "Construction",
  "Mining",
  "Long Haul",
  "Urban Logistics",
  "Cold Chain",
  "Public Transport",
  "Tourism",
  "Airport",
  "Waste Collection",
  "Municipal",
  "Medical",
  "Emergency",
  "Port Operations",
  "Container Transport",
] as const

export type VehicleFamily = (typeof vehicleFamilies)[number]
export type VehicleBodyType = (typeof vehicleBodyTypes)[number]
export type VehicleDutyClass = (typeof vehicleDutyClasses)[number]
export type VehiclePropulsion = (typeof vehiclePropulsions)[number]
export type VehicleApplicationTag = (typeof vehicleApplicationTags)[number]

export type VehicleTaxonomyField =
  | "vehicleFamily"
  | "bodyType"
  | "dutyClass"
  | "propulsion"
  | "applicationTag"

const taxonomyValues = {
  vehicleFamily: vehicleFamilies,
  bodyType: vehicleBodyTypes,
  dutyClass: vehicleDutyClasses,
  propulsion: vehiclePropulsions,
  applicationTag: vehicleApplicationTags,
} as const

const aliases: Partial<Record<VehicleTaxonomyField, Record<string, string>>> = {
  vehicleFamily: {
    trucks: "Truck",
    buses: "Bus",
    coaches: "Coach",
    trailers: "Trailer",
    puv: "PUV",
    "special vehicle": "Special Purpose Vehicle",
    "special purpose": "Special Purpose Vehicle",
  },
  bodyType: {
    cargo: "Cargo Truck",
    "tractor-head": "Tractor Head",
    "semi-trailer": "Semi Trailer",
    flatbed: "Flatbed Trailer",
    "flat-bed trailer": "Flatbed Trailer",
    "low-bed trailer": "Low Bed Trailer",
    "specialized / custom": "Special Purpose Vehicle",
    "specialized/custom": "Special Purpose Vehicle",
    "airport bus": "Apron Bus",
  },
  dutyClass: {
    light: "Light Duty",
    medium: "Medium Duty",
    heavy: "Heavy Duty",
    special: "Special Purpose",
  },
  propulsion: {
    electric: "Battery Electric",
    bev: "Battery Electric",
    battery: "Battery Electric",
    configurable: "Multiple / Configurable",
    multiple: "Multiple / Configurable",
  },
}

function comparable(value: string) {
  return value.trim().toLowerCase().replace(/[_]+/g, " ").replace(/\s+/g, " ")
}

export function normalizeTaxonomyValue<TField extends VehicleTaxonomyField>(field: TField, input: string) {
  const normalizedInput = comparable(input)
  const alias = aliases[field]?.[normalizedInput]
  const supported = taxonomyValues[field].find((value) => comparable(value) === normalizedInput)
  return (alias || supported) as (typeof taxonomyValues)[TField][number] | undefined
}

export function isSupportedTaxonomyValue<TField extends VehicleTaxonomyField>(
  field: TField,
  input: string,
): input is (typeof taxonomyValues)[TField][number] {
  return taxonomyValues[field].some((value) => value === input)
}
