import type { ObjectId } from "mongodb"
import type {
  VehicleApplicationTag,
  VehicleBodyType,
  VehicleDutyClass,
  VehicleFamily,
  VehiclePropulsion,
} from "@/lib/domain/vehicle-taxonomy"
import type { VehicleBrochure, VehicleDataIssue, VehicleNormalizationDecision } from "@/lib/domain/vehicle"

export type DatabaseImage = {
  url: string
  alt: string
}

export type BrandDocument = {
  _id?: ObjectId
  name: string
  slug: string
  logo?: DatabaseImage
  description?: string
  active: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export type TruckTypeDocument = {
  _id?: ObjectId
  name: string
  slug: string
  description?: string
  image?: DatabaseImage
  vehicleFamily?: VehicleFamily
  canonicalBodyType?: VehicleBodyType
  active: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export type VehicleImageDocument = DatabaseImage & {
  isPrimary: boolean
  order: number
  sourceUrl?: string
  sourcePage?: string
  storageProvider?: "local" | "cloudinary" | "vercel-blob" | "external"
  suggestedLocalPath?: string
  status?: string
}

export type TruckImageDocument = VehicleImageDocument

export type VehicleKeySpecsDocument = {
  engine?: string
  engineDisplacement?: string | number
  engineDisplacementCc?: number
  horsepower?: number
  powerKw?: number
  powerPs?: number
  torqueNm?: number
  payloadKg?: number
  gvwKg?: number
  gcmKg?: number
  /** Legacy spelling retained while existing documents are supported. */
  gcwKg?: number
  drive?: string
  fuelType?: string
  transmission?: string
  emissionStandard?: string
  wheelbaseMm?: number
  seatingCapacity?: number | string
  batteryCapacityKwh?: number | string
  rangeKm?: number | string
  bodyCapacity?: string
  rearBodyLength?: string
}

export type TruckKeySpecs = VehicleKeySpecsDocument

export type TruckSpecificationGroup = {
  title: string
  items: Array<{
    label: string
    value: string
    featured?: boolean
  }>
}

export type TruckDocument = {
  _id?: ObjectId
  slug: string
  brandId: ObjectId
  typeId: ObjectId
  name: string
  model?: string
  class?: string
  vehicleFamily?: VehicleFamily
  bodyType?: VehicleBodyType
  dutyClass?: VehicleDutyClass
  propulsion?: VehiclePropulsion
  applicationTags?: VehicleApplicationTag[]
  shortDescription?: string
  description?: string
  featured: boolean
  active: boolean
  images: VehicleImageDocument[]
  keySpecs?: TruckKeySpecs
  specifications?: Record<string, string | number | null>
  specificationGroups?: TruckSpecificationGroup[]
  applications?: string[]
  configurations?: string[]
  brochure?: VehicleBrochure
  brochureUrl?: string | null
  source?: {
    manufacturer: string
    website?: string
    productUrl: string
    alternateSourceUrls?: string[]
    verifiedAt: Date | string
    notes?: string
    dataWarnings?: string[]
  }
  normalization?: {
    decisions?: VehicleNormalizationDecision[]
    warnings?: VehicleDataIssue[]
  }
  seo?: {
    title?: string
    description?: string
    image?: string
  }
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export type IndustryDocument = {
  _id?: ObjectId
  name: string
  slug: string
  eyebrow?: string
  shortDescription?: string
  description?: string
  image?: DatabaseImage
  recommendedTruckTypeIds?: ObjectId[]
  applications?: string[]
  active: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export type ServiceDocument = {
  _id?: ObjectId
  name: string
  slug: string
  shortDescription?: string
  description?: string
  active: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export type SiteSettingsDocument = {
  _id: "main"
  companyName: string
  contact: {
    phone?: string
    email?: string
    hours?: string
    address?: {
      line1?: string
      line2?: string
      barangay?: string
      city?: string
      postalCode?: string
      country?: string
    }
  }
  socials?: {
    facebook?: string | null
    messenger?: string | null
    linkedin?: string | null
    instagram?: string | null
  }
  seo?: {
    defaultTitle?: string
    defaultDescription?: string
  }
  updatedAt: Date
}

export type QuoteStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "quotation-sent"
  | "negotiating"
  | "won"
  | "lost"
  | "archived"

export type SelectedTruckSnapshot = {
  /** Legacy field name intentionally retained throughout the Vehicle transition. */
  truckId?: ObjectId
  brand?: string
  model?: string
  slug?: string
}

export type QuoteRequestDocument = {
  _id?: ObjectId
  reference?: string
  name: string
  company?: string
  email?: string
  phone?: string
  preferredContact?: string
  selectedTruck?: SelectedTruckSnapshot
  selectedTruckLabel?: string
  truckRequirement?: string
  intendedApplication?: string
  message?: string
  source: "quote"
  status: QuoteStatus
  createdAt: Date
  updatedAt: Date
}

export type InquiryDocument = {
  _id?: ObjectId
  name: string
  company?: string
  email: string
  phone: string
  preferredContact: string
  message?: string
  source: "contact"
  status: "new" | "contacted" | "resolved" | "archived"
  createdAt: Date
  updatedAt: Date
}
