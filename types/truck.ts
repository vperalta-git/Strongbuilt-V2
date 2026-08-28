export type TruckCategory =
  | "Light Duty"
  | "Medium Duty"
  | "Heavy Duty"
  | "Passenger"
  | "Trailer"

export type TruckBodyType =
  | "Cargo"
  | "Dump Truck"
  | "Tractor Head"
  | "Bus"
  | "Trailer"
  | "Specialized / Custom"

export type MediaAsset = {
  url: string
  alt: string
  width?: number
  height?: number
  provider?: "local" | "cloudinary" | "vercel-blob" | "gridfs" | "external"
}

export type TruckSpecification = {
  label: string
  value: string
  group: "Powertrain" | "Dimensions & capacity" | "Chassis & running gear" | "Equipment"
  featured?: boolean
}

export type TruckSeo = {
  title?: string
  description?: string
  image?: string
}

export type Truck = {
  _id?: string
  slug: string
  brand: string
  model: string
  category: TruckCategory
  bodyType: TruckBodyType
  shortDescription: string
  description: string
  images: MediaAsset[]
  featured: boolean
  active: boolean
  applications: string[]
  configurations?: string[]
  specifications: TruckSpecification[]
  brochureUrl?: string
  seo?: TruckSeo
  displayOrder: number
  createdAt: string
  updatedAt: string
}

export type Brand = {
  name: string
  slug: string
  logoUrl?: string
  catalogNote: string
}

export type Industry = {
  slug: string
  name: string
  eyebrow: string
  summary: string
  description: string
  image: MediaAsset
  applications: string[]
  recommendedBodyTypes: TruckBodyType[]
}
