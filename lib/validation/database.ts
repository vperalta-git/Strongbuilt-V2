import { z } from "zod"

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
  description: z.string().trim().min(1).optional(),
})

export const truckTypeSeedSchema = managedRecordSchema.extend({
  name: z.string().trim().min(1),
  slug: slugSchema,
  description: z.string().trim().min(1).optional(),
  image: imageSchema.optional(),
})

const truckImageSchema = imageSchema.extend({
  isPrimary: z.boolean(),
  order: z.number().int().nonnegative(),
})

const keySpecsSchema = z.object({
  horsepower: z.number().nonnegative().optional(),
  payloadKg: z.number().nonnegative().optional(),
  gvwKg: z.number().nonnegative().optional(),
  gcwKg: z.number().nonnegative().optional(),
  drive: z.string().trim().min(1).optional(),
  fuelType: z.string().trim().min(1).optional(),
  transmission: z.string().trim().min(1).optional(),
  emissionStandard: z.string().trim().min(1).optional(),
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
  brochureUrl: z.string().trim().min(1).nullable().optional(),
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
