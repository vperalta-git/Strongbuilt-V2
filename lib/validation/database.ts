import { z } from "zod"
import {
  vehicleApplicationTags,
  vehicleBodyTypes,
  vehicleDutyClasses,
  vehicleFamilies,
  vehiclePropulsions,
} from "@/lib/domain/vehicle-taxonomy"

const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL-safe slug.")
const imageSchema = z.object({
  url: z.string().trim().min(1),
  alt: z.string().trim().min(1),
})
const managedRecordSchema = z.object({
  active: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
})

export const brandSeedSchema = managedRecordSchema.extend({
  name: z.string().trim().min(1),
  slug: slugSchema,
  logo: imageSchema.optional(),
  logoMetadata: z.object({
    url: z.url().optional(),
    alt: z.string().trim().min(1),
    suggestedLocalPath: z.string().trim().min(1).optional(),
    status: z.string().trim().min(1).optional(),
  }).optional(),
  officialWebsite: z.url().optional(),
  description: z.string().trim().min(1).optional(),
  source: z.object({
    website: z.url(),
    verifiedAt: z.union([z.date(), z.string().trim().min(1)]),
  }).optional(),
  aliases: z.array(z.string().trim().min(1)).optional(),
})

export const truckTypeSeedSchema = managedRecordSchema.extend({
  name: z.string().trim().min(1),
  slug: slugSchema,
  description: z.string().trim().min(1).optional(),
  image: imageSchema.optional(),
  vehicleFamily: z.enum(vehicleFamilies).optional(),
  canonicalBodyType: z.enum(vehicleBodyTypes).optional(),
})

const truckImageSchema = imageSchema.extend({
  isPrimary: z.boolean(),
  order: z.number().int().nonnegative(),
  sourceUrl: z.url().optional(),
  sourcePage: z.url().optional(),
  storageProvider: z.enum(["local", "cloudinary", "vercel-blob", "external"]).optional(),
  suggestedLocalPath: z.string().trim().min(1).optional(),
  status: z.string().trim().min(1).optional(),
})

const keySpecsSchema = z.object({
  engine: z.string().trim().min(1).optional(),
  engineDisplacement: z.union([z.string().trim().min(1), z.number().nonnegative()]).optional(),
  engineDisplacementCc: z.number().nonnegative().optional(),
  horsepower: z.number().nonnegative().optional(),
  powerKw: z.number().nonnegative().optional(),
  powerPs: z.number().nonnegative().optional(),
  torqueNm: z.number().nonnegative().optional(),
  payloadKg: z.number().nonnegative().optional(),
  gvwKg: z.number().nonnegative().optional(),
  gcmKg: z.number().nonnegative().optional(),
  gcwKg: z.number().nonnegative().optional(),
  drive: z.string().trim().min(1).optional(),
  fuelType: z.string().trim().min(1).optional(),
  transmission: z.string().trim().min(1).optional(),
  emissionStandard: z.string().trim().min(1).optional(),
  wheelbaseMm: z.number().nonnegative().optional(),
  seatingCapacity: z.union([z.string().trim().min(1), z.number().nonnegative()]).optional(),
  batteryCapacityKwh: z.union([z.string().trim().min(1), z.number().nonnegative()]).optional(),
  rangeKm: z.union([z.string().trim().min(1), z.number().nonnegative()]).optional(),
  bodyCapacity: z.string().trim().min(1).optional(),
  rearBodyLength: z.string().trim().min(1).optional(),
})

const brochureSchema = z.object({
  url: z.string().trim().min(1),
  title: z.string().trim().min(1).optional(),
  source: z.string().trim().min(1).optional(),
})

const sourceSchema = z.object({
  manufacturer: z.string().trim().min(1),
  website: z.url().optional(),
  productUrl: z.url(),
  alternateSourceUrls: z.array(z.url()).optional(),
  verifiedAt: z.union([z.date(), z.string().trim().min(1)]),
  notes: z.string().trim().min(1).optional(),
  dataWarnings: z.array(z.string().trim().min(1)).optional(),
})

const specificationItemSchema = z.object({
  label: z.string().trim().min(1),
  value: z.string().trim().min(1),
  featured: z.boolean().optional(),
})

export const truckSeedSchema = managedRecordSchema.extend({
  slug: slugSchema,
  brandSlug: slugSchema,
  typeSlug: slugSchema,
  name: z.string().trim().min(1),
  model: z.string().trim().min(1).optional(),
  class: z.string().trim().min(1).optional(),
  vehicleFamily: z.enum(vehicleFamilies).optional(),
  bodyType: z.enum(vehicleBodyTypes).optional(),
  dutyClass: z.enum(vehicleDutyClasses).optional(),
  propulsion: z.enum(vehiclePropulsions).optional(),
  applicationTags: z.array(z.enum(vehicleApplicationTags)).optional(),
  shortDescription: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  featured: z.boolean(),
  images: z.array(truckImageSchema).min(1),
  keySpecs: keySpecsSchema.optional(),
  specifications: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).optional(),
  specificationGroups: z.array(z.object({
    title: z.string().trim().min(1),
    items: z.array(specificationItemSchema).min(1),
  })).optional(),
  applications: z.array(z.string().trim().min(1)).optional(),
  configurations: z.array(z.string().trim().min(1)).optional(),
  brochure: brochureSchema.optional(),
  brochureUrl: z.string().trim().min(1).nullable().optional(),
  source: sourceSchema.optional(),
  seo: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().min(1).optional(),
    image: z.string().trim().min(1).optional(),
  }).optional(),
})

export const industrySeedSchema = managedRecordSchema.extend({
  name: z.string().trim().min(1),
  slug: slugSchema,
  eyebrow: z.string().trim().min(1).optional(),
  shortDescription: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  image: imageSchema.optional(),
  recommendedTruckTypeSlugs: z.array(slugSchema).optional(),
  applications: z.array(z.string().trim().min(1)).optional(),
})

export const serviceSeedSchema = managedRecordSchema.extend({
  name: z.string().trim().min(1),
  slug: slugSchema,
  shortDescription: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
})

export const siteSettingsSeedSchema = z.object({
  _id: z.literal("main"),
  companyName: z.string().trim().min(1),
  contact: z.object({
    phone: z.string().trim().min(1).optional(),
    email: z.email().optional(),
    hours: z.string().trim().min(1).optional(),
    address: z.object({
      line1: z.string().trim().min(1).optional(),
      line2: z.string().trim().min(1).optional(),
      barangay: z.string().trim().min(1).optional(),
      city: z.string().trim().min(1).optional(),
      postalCode: z.string().trim().min(1).optional(),
      country: z.string().trim().min(1).optional(),
    }).optional(),
  }),
  socials: z.object({
    facebook: z.string().nullable().optional(),
    messenger: z.string().nullable().optional(),
    linkedin: z.string().nullable().optional(),
    instagram: z.string().nullable().optional(),
  }).optional(),
  seo: z.object({
    defaultTitle: z.string().trim().min(1).optional(),
    defaultDescription: z.string().trim().min(1).optional(),
  }).optional(),
})

export type BrandSeed = z.infer<typeof brandSeedSchema>
export type TruckTypeSeed = z.infer<typeof truckTypeSeedSchema>
export type TruckSeed = z.infer<typeof truckSeedSchema>
export type IndustrySeed = z.infer<typeof industrySeedSchema>
export type ServiceSeed = z.infer<typeof serviceSeedSchema>
export type SiteSettingsSeed = z.infer<typeof siteSettingsSeedSchema>
