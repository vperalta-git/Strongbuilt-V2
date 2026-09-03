import { ObjectId } from "mongodb"
import type { Vehicle, VehicleImage } from "@/lib/domain/vehicle"
import type { VehicleBodyType, VehicleFamily } from "@/lib/domain/vehicle-taxonomy"
import type { SelectedTruckSnapshot } from "@/types/database"
import { getApprovedLocalTruckImagePath } from "@/lib/data/truck-local-images"
import type { Truck, TruckBodyType, TruckCategory, TruckSpecification } from "@/types/truck"

const legacySpecificationGroups = new Set<TruckSpecification["group"]>([
  "Powertrain",
  "Dimensions & capacity",
  "Chassis & running gear",
  "Equipment",
])

const canonicalBodyTypeByLegacy: Record<TruckBodyType, VehicleBodyType> = {
  Cargo: "Cargo Truck",
  "Dump Truck": "Dump Truck",
  "Tractor Head": "Tractor Head",
  Bus: "Bus",
  Trailer: "Trailer",
  "Specialized / Custom": "Special Purpose Vehicle",
}

const familyByLegacyBodyType: Record<TruckBodyType, VehicleFamily> = {
  Cargo: "Truck",
  "Dump Truck": "Truck",
  "Tractor Head": "Truck",
  Bus: "Bus",
  Trailer: "Trailer",
  "Specialized / Custom": "Special Purpose Vehicle",
}

const legacyBodyTypes = new Set<TruckBodyType>([
  "Cargo",
  "Dump Truck",
  "Tractor Head",
  "Bus",
  "Trailer",
  "Specialized / Custom",
])

const legacyCategories = new Set<TruckCategory>([
  "Light Duty",
  "Medium Duty",
  "Heavy Duty",
  "Passenger",
  "Trailer",
])

function inferLegacySpecificationGroup(title: string, label: string): TruckSpecification["group"] | undefined {
  if (legacySpecificationGroups.has(title as TruckSpecification["group"])) {
    return title as TruckSpecification["group"]
  }

  const value = `${title} ${label}`.toLowerCase()
  if (/engine|power|output|torque|fuel|transmission|emission/.test(value)) return "Powertrain"
  if (/dimension|capacity|gvw|gcm|payload|weight|length|width|height|wheelbase|seat/.test(value)) {
    return "Dimensions & capacity"
  }
  if (/chassis|axle|suspension|brake|tire|steering/.test(value)) return "Chassis & running gear"
  if (/equipment|feature/.test(value)) return "Equipment"
  return undefined
}

function imageStorageProvider(url: string): VehicleImage["storageProvider"] {
  return url.startsWith("/") ? "local" : "external"
}

function legacyImageStorageProvider(provider: Truck["images"][number]["provider"], url: string) {
  if (provider === "gridfs") return "external" as const
  return provider || imageStorageProvider(url)
}

export function isLegacyTruckBodyType(value: string): value is TruckBodyType {
  return legacyBodyTypes.has(value as TruckBodyType)
}

export function isLegacyTruckCategory(value: string): value is TruckCategory {
  return legacyCategories.has(value as TruckCategory)
}

export function legacyTruckToVehicle(truck: Truck): Vehicle {
  return {
    _id: truck._id,
    slug: truck.slug,
    brand: { name: truck.brand },
    type: { name: truck.bodyType },
    name: `${truck.brand} ${truck.model}`,
    model: truck.model,
    vehicleFamily: familyByLegacyBodyType[truck.bodyType],
    bodyType: canonicalBodyTypeByLegacy[truck.bodyType],
    dutyClass: truck.category,
    propulsion: "Unknown",
    applicationTags: [],
    shortDescription: truck.shortDescription,
    description: truck.description,
    images: truck.images.map((image, index) => ({
      url: image.url,
      alt: image.alt,
      isPrimary: index === 0,
      order: index + 1,
      storageProvider: legacyImageStorageProvider(image.provider, image.url),
    })),
    specificationGroups: [...new Set(truck.specifications.map((specification) => specification.group))].map((title) => ({
      title,
      items: truck.specifications
        .filter((specification) => specification.group === title)
        .map(({ label, value, featured }) => ({ label, value, ...(featured === undefined ? {} : { featured }) })),
    })),
    applications: truck.applications,
    configurations: truck.configurations,
    ...(truck.brochureUrl ? { brochureUrl: truck.brochureUrl } : {}),
    seo: truck.seo,
    featured: truck.featured,
    active: truck.active,
    displayOrder: truck.displayOrder,
    createdAt: truck.createdAt,
    updatedAt: truck.updatedAt,
    legacy: { category: truck.category, bodyType: truck.bodyType },
  }
}

function resolveLegacyCategory(vehicle: Vehicle): TruckCategory {
  if (vehicle.legacy) return vehicle.legacy.category
  if (vehicle.dutyClass && isLegacyTruckCategory(vehicle.dutyClass)) return vehicle.dutyClass
  if (vehicle.dutyClass === "Mini") return "Light Duty"
  if (vehicle.vehicleFamily === "Bus" || vehicle.vehicleFamily === "Coach" || vehicle.vehicleFamily === "PUV") return "Passenger"
  if (vehicle.vehicleFamily === "Trailer") return "Trailer"
  throw new Error(`Vehicle ${vehicle.slug} requires an explicit legacy category projection.`)
}

function resolveLegacyBodyType(vehicle: Vehicle): TruckBodyType {
  if (vehicle.legacy) return vehicle.legacy.bodyType

  const mapping: Partial<Record<VehicleBodyType, TruckBodyType>> = {
    "Mini Truck": "Cargo",
    "Cargo Truck": "Cargo",
    "Rigid Truck": "Cargo",
    "Dump Truck": "Dump Truck",
    "Tractor Head": "Tractor Head",
    "Box Van": "Cargo",
    "Wing Van": "Cargo",
    "Refrigerated Truck": "Cargo",
    Bus: "Bus",
    "City Bus": "Bus",
    "Intercity Bus": "Bus",
    Coach: "Bus",
    "Apron Bus": "Bus",
    Trailer: "Trailer",
    "Semi Trailer": "Trailer",
    "Flatbed Trailer": "Trailer",
    "Low Bed Trailer": "Trailer",
    "Special Purpose Vehicle": "Specialized / Custom",
    "Medical Vehicle": "Specialized / Custom",
    "Emergency Vehicle": "Specialized / Custom",
    "Municipal Vehicle": "Specialized / Custom",
    "Mixer Truck": "Specialized / Custom",
    "Water Tanker": "Specialized / Custom",
    "Oil Tanker": "Specialized / Custom",
    "Garbage Truck": "Specialized / Custom",
    "Crane Truck": "Specialized / Custom",
  }
  const bodyType = mapping[vehicle.bodyType]
  if (!bodyType) throw new Error(`Vehicle ${vehicle.slug} requires an explicit legacy body-type projection.`)
  return bodyType
}

export function vehicleToLegacyTruck(vehicle: Vehicle): Truck {
  const specifications: TruckSpecification[] = vehicle.specificationGroups.flatMap((group) => {
    return group.items.flatMap((item) => {
      const legacyGroup = inferLegacySpecificationGroup(group.title, item.label)
      if (!legacyGroup) return []
      return [{
        label: item.label,
        value: item.value,
        group: legacyGroup,
        ...(item.featured === undefined ? {} : { featured: item.featured }),
      }]
    })
  })

  const sortedImages = [...vehicle.images].sort((first, second) => first.order - second.order)
  const localImagePath = getApprovedLocalTruckImagePath(vehicle.slug)
  const images = localImagePath
    ? [{ url: localImagePath, alt: sortedImages[0]?.alt || `${vehicle.brand.name} ${vehicle.model || vehicle.name}` }]
    : sortedImages
        .filter((image) => !(image.storageProvider === "external" && /^https?:\/\//i.test(image.url)))
        .map(({ url, alt }) => ({ url, alt }))

  return {
    _id: vehicle._id,
    slug: vehicle.slug,
    brand: vehicle.brand.name,
    model: vehicle.model || vehicle.name,
    category: resolveLegacyCategory(vehicle),
    bodyType: resolveLegacyBodyType(vehicle),
    shortDescription: vehicle.shortDescription || "",
    description: vehicle.description || "",
    images,
    featured: vehicle.featured,
    active: vehicle.active,
    applications: vehicle.applications,
    configurations: vehicle.configurations,
    specifications,
    ...((vehicle.brochure?.url || vehicle.brochureUrl) ? { brochureUrl: vehicle.brochure?.url || vehicle.brochureUrl } : {}),
    seo: vehicle.seo,
    displayOrder: vehicle.displayOrder,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  }
}

export function createLegacySelectedTruckSnapshot(vehicle: Vehicle): SelectedTruckSnapshot {
  return {
    ...(vehicle._id && ObjectId.isValid(vehicle._id) ? { truckId: new ObjectId(vehicle._id) } : {}),
    brand: vehicle.brand.name,
    model: vehicle.model || vehicle.name,
    slug: vehicle.slug,
  }
}
