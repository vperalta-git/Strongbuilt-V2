import { brands } from "@/lib/data/brands"
import { industries } from "@/lib/data/industries"
import { mockTrucks, truckBodyTypes } from "@/lib/data/mock-trucks"
import { services } from "@/lib/data/services"
import { siteConfig } from "@/config/site"
import type {
  BrandSeed,
  IndustrySeed,
  ServiceSeed,
  SiteSettingsSeed,
  TruckSeed,
  TruckTypeSeed,
} from "@/lib/validation/database"
import type { Truck } from "@/types/truck"

const truckTypeDetails: Record<(typeof truckBodyTypes)[number], { description: string; image: string }> = {
  Cargo: {
    description: "Delivery, distribution, and field-crew configurations.",
    image: "/images/trucks/forland-cargo-double-cab.png",
  },
  "Dump Truck": {
    description: "Material movement and worksite hauling applications.",
    image: "/images/trucks/forland-dump-3cbm.png",
  },
  "Tractor Head": {
    description: "Container, trailer, and long-haul fleet operations.",
    image: "/images/trucks/shacman-x3000-420.png",
  },
  Bus: {
    description: "Commercial and institutional passenger requirements.",
    image: "/images/trucks/asiastar-ybl6119h.png",
  },
  Trailer: {
    description: "Flat-bed, tanker, mixer, and heavy-transport applications.",
    image: "/images/trucks/cimc-flatbed-40ft.png",
  },
  "Specialized / Custom": {
    description: "Boom, aerial, utility, and custom body solutions.",
    image: "/images/trucks/forland-boom-truck.png",
  },
}

export const truckTypeSlugByName = {
  Cargo: "cargo",
  "Dump Truck": "dump-truck",
  "Tractor Head": "tractor-head",
  Bus: "bus",
  Trailer: "trailer",
  "Specialized / Custom": "specialized-custom",
} as const

function specificationValue(truck: Truck, label: string) {
  return truck.specifications.find((specification) => specification.label.toLowerCase() === label.toLowerCase())?.value
}

function parseKilograms(value?: string) {
  if (!value) return undefined
  const match = value.match(/([\d,]+)\s*kg/i)
  return match ? Number(match[1].replaceAll(",", "")) : undefined
}

function buildKeySpecs(truck: Truck): TruckSeed["keySpecs"] {
  const searchableValues = truck.specifications.map((specification) => specification.value).join(" ")
  const horsepowerMatch = searchableValues.match(/(\d{2,4})\s*HP/i)
  const emissionMatch = searchableValues.match(/Euro\s*[0-9IVX]+/i)
  const payloadSpecification = truck.specifications.find((specification) => /payload/i.test(specification.label))

  const values = {
    horsepower: horsepowerMatch ? Number(horsepowerMatch[1]) : undefined,
    payloadKg: parseKilograms(payloadSpecification?.value),
    gvwKg: parseKilograms(specificationValue(truck, "Gross vehicle weight")),
    drive: specificationValue(truck, "Drive"),
    transmission: specificationValue(truck, "Transmission"),
    emissionStandard: emissionMatch?.[0],
  }
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined))
}

function buildSpecificationGroups(truck: Truck): NonNullable<TruckSeed["specificationGroups"]> {
  const groupNames = [...new Set(truck.specifications.map((specification) => specification.group))]
  return groupNames.map((title) => ({
    title,
    items: truck.specifications
      .filter((specification) => specification.group === title)
      .map(({ label, value, featured }) => ({ label, value, ...(featured === undefined ? {} : { featured }) })),
  }))
}

export const brandSeeds: BrandSeed[] = brands.map((brand, index) => ({
  name: brand.name,
  slug: brand.slug,
  ...(brand.logoUrl ? { logo: { url: brand.logoUrl, alt: `${brand.name} logo` } } : {}),
  description: brand.catalogNote,
  active: true,
  displayOrder: index + 1,
}))

export const truckTypeSeeds: TruckTypeSeed[] = truckBodyTypes.map((name, index) => ({
  name,
  slug: truckTypeSlugByName[name],
  description: truckTypeDetails[name].description,
  image: {
    url: truckTypeDetails[name].image,
    alt: `${name} commercial vehicle`,
  },
  active: true,
  displayOrder: index + 1,
}))

export const truckSeeds: TruckSeed[] = mockTrucks.map((truck) => ({
  slug: truck.slug,
  brandSlug: brands.find((brand) => brand.name === truck.brand)?.slug || "",
  typeSlug: truckTypeSlugByName[truck.bodyType],
  name: `${truck.brand} ${truck.model}`,
  model: truck.model,
  class: truck.category,
  shortDescription: truck.shortDescription,
  description: truck.description,
  featured: truck.featured,
  active: truck.active,
  images: truck.images.map((image, index) => ({
    url: image.url,
    alt: image.alt,
    isPrimary: index === 0,
    order: index + 1,
  })),
  keySpecs: buildKeySpecs(truck),
  specifications: Object.fromEntries(truck.specifications.map(({ label, value }) => [label, value])),
  specificationGroups: buildSpecificationGroups(truck),
  applications: truck.applications,
  ...(truck.configurations ? { configurations: truck.configurations } : {}),
  brochureUrl: truck.brochureUrl ?? null,
  ...(truck.seo ? { seo: truck.seo } : {}),
  displayOrder: truck.displayOrder,
}))

export const industrySeeds: IndustrySeed[] = industries.map((industry, index) => ({
  name: industry.name,
  slug: industry.slug,
  eyebrow: industry.eyebrow,
  shortDescription: industry.summary,
  description: industry.description,
  image: { url: industry.image.url, alt: industry.image.alt },
  recommendedTruckTypeSlugs: industry.recommendedBodyTypes.map((name) => truckTypeSlugByName[name]),
  applications: industry.applications,
  active: true,
  displayOrder: index + 1,
}))

export const serviceSeeds: ServiceSeed[] = services.map((service, index) => ({
  name: service.title,
  slug: service.slug,
  shortDescription: service.summary,
  description: service.detail,
  active: true,
  displayOrder: index + 1,
}))

export const siteSettingsSeed: SiteSettingsSeed = {
  _id: "main",
  companyName: siteConfig.legalName,
  contact: {
    phone: siteConfig.contact.phoneDisplay,
    email: siteConfig.contact.email,
    hours: siteConfig.contact.hours,
    address: {
      line1: siteConfig.contact.addressLines[0],
      line2: siteConfig.contact.addressLines[1],
      barangay: siteConfig.contact.addressLines[2],
      city: "Pasig City",
      postalCode: "1600",
      country: siteConfig.contact.addressLines[4],
    },
  },
  socials: {
    facebook: siteConfig.social.facebook || null,
    messenger: siteConfig.social.messenger || null,
    linkedin: siteConfig.social.linkedin || null,
    instagram: null,
  },
  seo: {
    defaultTitle: "Strongbuilt | Commercial Trucks & Fleet Solutions",
    defaultDescription: siteConfig.description,
  },
}
