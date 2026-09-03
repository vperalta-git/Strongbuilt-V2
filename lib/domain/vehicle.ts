import type {
  VehicleApplicationTag,
  VehicleBodyType,
  VehicleDutyClass,
  VehicleFamily,
  VehiclePropulsion,
} from "@/lib/domain/vehicle-taxonomy"
import type { TruckBodyType, TruckCategory } from "@/types/truck"

export type VehicleImage = {
  url: string
  alt: string
  isPrimary: boolean
  order: number
  sourceUrl?: string
  sourcePage?: string
  storageProvider?: "local" | "cloudinary" | "vercel-blob" | "external"
  suggestedLocalPath?: string
  status?: string
}

export type VehicleBrochure = {
  url: string
  title?: string
  source?: string
}

export type VehicleSource = {
  manufacturer: string
  website?: string
  productUrl: string
  alternateSourceUrls?: string[]
  verifiedAt: string
  notes?: string
  dataWarnings?: string[]
}

export type VehicleKeySpecs = {
  engine?: string
  engineDisplacement?: string | number
  engineDisplacementCc?: number
  horsepower?: number
  powerKw?: number
  powerPs?: number
  torqueNm?: number
  transmission?: string
  drive?: string
  wheelbaseMm?: number
  gvwKg?: number
  payloadKg?: number
  gcmKg?: number
  seatingCapacity?: number | string
  batteryCapacityKwh?: number | string
  rangeKm?: number | string
  fuelType?: string
  emissionStandard?: string
  bodyCapacity?: string
  rearBodyLength?: string
}

export type VehicleSpecificationGroup = {
  title: string
  items: Array<{
    label: string
    value: string
    featured?: boolean
  }>
}

export type VehicleNormalizationDecision = {
  field: string
  rawValue?: unknown
  normalizedValue?: unknown
  reason: string
}

export type VehicleDataIssue = {
  severity: "warning" | "error"
  field?: string
  message: string
  code?: string
}

export type Vehicle = {
  _id?: string
  slug: string
  brand: {
    id?: string
    slug?: string
    name: string
  }
  type?: {
    id?: string
    slug?: string
    name: string
  }
  name: string
  model?: string
  vehicleFamily: VehicleFamily
  bodyType: VehicleBodyType
  dutyClass?: VehicleDutyClass
  propulsion: VehiclePropulsion
  applicationTags: VehicleApplicationTag[]
  shortDescription?: string
  description?: string
  images: VehicleImage[]
  keySpecs?: VehicleKeySpecs
  specificationGroups: VehicleSpecificationGroup[]
  applications: string[]
  configurations?: string[]
  brochure?: VehicleBrochure
  brochureUrl?: string
  source?: VehicleSource
  normalization?: {
    decisions?: VehicleNormalizationDecision[]
    warnings?: VehicleDataIssue[]
  }
  seo?: {
    title?: string
    description?: string
    image?: string
  }
  featured: boolean
  active: boolean
  displayOrder: number
  createdAt: string
  updatedAt: string
  legacy?: {
    category: TruckCategory
    bodyType: TruckBodyType
  }
}
