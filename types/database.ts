import type { ObjectId } from "mongodb"

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
  active: boolean
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export type TruckImageDocument = DatabaseImage & {
  isPrimary: boolean
  order: number
}

export type TruckKeySpecs = {
  horsepower?: number
  payloadKg?: number
  gvwKg?: number
  gcwKg?: number
  drive?: string
  fuelType?: string
  transmission?: string
  emissionStandard?: string
}

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
  shortDescription?: string
  description?: string
  featured: boolean
  active: boolean
  images: TruckImageDocument[]
  keySpecs?: TruckKeySpecs
  specifications?: Record<string, string | number | null>
  specificationGroups?: TruckSpecificationGroup[]
  applications?: string[]
  configurations?: string[]
  brochureUrl?: string | null
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
