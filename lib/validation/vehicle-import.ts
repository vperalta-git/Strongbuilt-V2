import { z } from "zod"
import { vehicleKeySpecsSchema, vehicleSpecificationGroupSchema } from "@/lib/validation/vehicle"

const slugSchema = z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL-safe slug.")
const nonEmptyString = z.string().trim().min(1)
const urlOrLocalPathSchema = nonEmptyString.refine((value) => {
  if (value.startsWith("/")) return true
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}, "Use an absolute URL or a root-relative local path.")

export const vehicleImportIssueSchema = z.object({
  severity: z.enum(["warning", "error"]),
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
})

const importImageSchema = z.object({
  url: urlOrLocalPathSchema,
  alt: nonEmptyString,
  isPrimary: z.boolean(),
  order: z.number().int().nonnegative(),
  sourceUrl: z.url().optional(),
  sourcePage: z.url().optional(),
  storageProvider: z.enum(["local", "cloudinary", "vercel-blob", "external"]).optional(),
  suggestedLocalPath: nonEmptyString.optional(),
  status: nonEmptyString.optional(),
})

const importSourceSchema = z.object({
  manufacturer: nonEmptyString,
  website: z.url().optional(),
  productUrl: z.url(),
  alternateSourceUrls: z.array(z.url()).optional(),
  verifiedAt: z.union([z.date(), nonEmptyString]).refine((value) => !Number.isNaN(new Date(value).valueOf()), "Use a valid verification date."),
  notes: nonEmptyString.optional(),
  dataWarnings: z.array(nonEmptyString).optional(),
})

export const vehicleImportConfigurationSchema = z.object({
  name: nonEmptyString,
  sourceValue: z.unknown().optional(),
  specifications: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).optional(),
})

export const rawVehicleImportSchema = z.object({
  slug: slugSchema,
  brandSlug: slugSchema,
  name: nonEmptyString,
  model: nonEmptyString.optional(),
  vehicleFamily: nonEmptyString,
  bodyType: nonEmptyString,
  dutyClass: nonEmptyString.optional(),
  propulsion: nonEmptyString.default("Unknown"),
  applicationTags: z.array(nonEmptyString).default([]),
  shortDescription: nonEmptyString.optional(),
  description: nonEmptyString.optional(),
  images: z.array(importImageSchema).min(1),
  keySpecs: vehicleKeySpecsSchema.optional(),
  specificationGroups: z.array(vehicleSpecificationGroupSchema).default([]),
  applications: z.array(nonEmptyString).default([]),
  configurations: z.array(z.union([nonEmptyString, vehicleImportConfigurationSchema])).optional(),
  brochure: z.object({
    url: urlOrLocalPathSchema,
    title: nonEmptyString.optional(),
    source: nonEmptyString.optional(),
  }).optional(),
  brochureUrl: urlOrLocalPathSchema.optional(),
  source: importSourceSchema,
  seo: z.object({
    title: nonEmptyString.optional(),
    description: nonEmptyString.optional(),
    image: urlOrLocalPathSchema.optional(),
  }).optional(),
  featured: z.boolean().default(false),
  active: z.boolean().default(false),
  displayOrder: z.number().int().nonnegative().default(0),
}).superRefine((record, context) => {
  const primaryImages = record.images.filter((image) => image.isPrimary)
  if (primaryImages.length !== 1) {
    context.addIssue({
      code: "custom",
      path: ["images"],
      message: "Exactly one primary image is required.",
    })
  }
})

export type RawVehicleImport = z.infer<typeof rawVehicleImportSchema>
export type VehicleImportIssue = z.infer<typeof vehicleImportIssueSchema>
