import { ObjectId } from "mongodb"
import { z } from "zod"
import {
  vehicleApplicationTags,
  vehicleBodyTypes,
  vehicleDutyClasses,
  vehicleFamilies,
  vehiclePropulsions,
} from "@/lib/domain/vehicle-taxonomy"

const nonEmptyString = z.string().trim().min(1)
const nonNegativeNumber = z.number().finite().nonnegative()
const slugSchema = nonEmptyString.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase URL-safe slug.")

export const vehicleImageSchema = z.object({
  url: nonEmptyString,
  alt: nonEmptyString,
  isPrimary: z.boolean(),
  order: z.number().int().nonnegative(),
  sourceUrl: z.url().optional(),
  sourcePage: z.url().optional(),
  storageProvider: z.enum(["local", "cloudinary", "vercel-blob", "external"]).optional(),
  suggestedLocalPath: nonEmptyString.optional(),
  status: nonEmptyString.optional(),
})

export const vehicleKeySpecsSchema = z.object({
  engine: nonEmptyString.optional(),
  engineDisplacement: z.union([nonEmptyString, nonNegativeNumber]).optional(),
  engineDisplacementCc: nonNegativeNumber.optional(),
  horsepower: nonNegativeNumber.optional(),
  powerKw: nonNegativeNumber.optional(),
  powerPs: nonNegativeNumber.optional(),
  torqueNm: nonNegativeNumber.optional(),
  transmission: nonEmptyString.optional(),
  drive: nonEmptyString.optional(),
  wheelbaseMm: nonNegativeNumber.optional(),
  gvwKg: nonNegativeNumber.optional(),
  payloadKg: nonNegativeNumber.optional(),
  gcmKg: nonNegativeNumber.optional(),
  gcwKg: nonNegativeNumber.optional(),
  seatingCapacity: z.union([nonEmptyString, nonNegativeNumber]).optional(),
  batteryCapacityKwh: z.union([nonEmptyString, nonNegativeNumber]).optional(),
  rangeKm: z.union([nonEmptyString, nonNegativeNumber]).optional(),
  fuelType: nonEmptyString.optional(),
  emissionStandard: nonEmptyString.optional(),
  bodyCapacity: nonEmptyString.optional(),
  rearBodyLength: nonEmptyString.optional(),
})

export const vehicleSpecificationGroupSchema = z.object({
  title: nonEmptyString,
  items: z.array(z.object({
    label: nonEmptyString,
    value: nonEmptyString,
    featured: z.boolean().optional(),
  })).min(1),
})

export const vehicleBrochureSchema = z.object({
  url: nonEmptyString,
  title: nonEmptyString.optional(),
  source: nonEmptyString.optional(),
})

export const vehicleSourceSchema = z.object({
  manufacturer: nonEmptyString,
  website: z.url().optional(),
  productUrl: z.url(),
  alternateSourceUrls: z.array(z.url()).optional(),
  verifiedAt: z.union([z.date(), nonEmptyString]),
  notes: nonEmptyString.optional(),
  dataWarnings: z.array(nonEmptyString).optional(),
})

export const vehicleImportMetadataSchema = z.object({
  source: z.literal("manufacturer-import"),
  manufacturer: nonEmptyString,
  batch: nonEmptyString,
  importedAt: z.union([z.date(), nonEmptyString]),
  verifiedAt: z.union([z.date(), nonEmptyString]),
  importVersion: z.number().int().positive(),
})

export const mongoVehicleDocumentSchema = z.object({
  _id: z.instanceof(ObjectId),
  slug: slugSchema,
  brandId: z.instanceof(ObjectId),
  typeId: z.instanceof(ObjectId),
  name: nonEmptyString,
  model: nonEmptyString.optional(),
  class: nonEmptyString.optional(),
  vehicleFamily: z.enum(vehicleFamilies).optional(),
  bodyType: z.enum(vehicleBodyTypes).optional(),
  dutyClass: z.enum(vehicleDutyClasses).optional(),
  propulsion: z.enum(vehiclePropulsions).optional(),
  applicationTags: z.array(z.enum(vehicleApplicationTags)).optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  featured: z.boolean(),
  active: z.boolean(),
  images: z.array(vehicleImageSchema).min(1),
  keySpecs: vehicleKeySpecsSchema.optional(),
  specifications: z.record(z.string(), z.union([z.string(), z.number(), z.null()])).optional(),
  specificationGroups: z.array(vehicleSpecificationGroupSchema).optional(),
  applications: z.array(nonEmptyString).optional(),
  configurations: z.array(nonEmptyString).optional(),
  brochure: vehicleBrochureSchema.optional(),
  brochureUrl: nonEmptyString.nullable().optional(),
  source: vehicleSourceSchema.optional(),
  importMetadata: vehicleImportMetadataSchema.optional(),
  normalization: z.object({
    decisions: z.array(z.object({
      field: nonEmptyString,
      rawValue: z.unknown().optional(),
      normalizedValue: z.unknown().optional(),
      reason: nonEmptyString,
    })).optional(),
    warnings: z.array(z.object({
      severity: z.enum(["warning", "error"]),
      field: nonEmptyString.optional(),
      message: nonEmptyString,
      code: nonEmptyString.optional(),
    })).optional(),
  }).optional(),
  seo: z.object({
    title: nonEmptyString.optional(),
    description: nonEmptyString.optional(),
    image: nonEmptyString.optional(),
  }).optional(),
  displayOrder: z.number().int().nonnegative(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).passthrough()

export const canonicalVehicleSchema = z.object({
  _id: nonEmptyString.optional(),
  slug: slugSchema,
  brand: z.object({
    id: nonEmptyString.optional(),
    slug: slugSchema.optional(),
    name: nonEmptyString,
  }),
  type: z.object({ id: nonEmptyString.optional(), slug: slugSchema.optional(), name: nonEmptyString }).optional(),
  name: nonEmptyString,
  model: nonEmptyString.optional(),
  vehicleFamily: z.enum(vehicleFamilies),
  bodyType: z.enum(vehicleBodyTypes),
  dutyClass: z.enum(vehicleDutyClasses).optional(),
  propulsion: z.enum(vehiclePropulsions),
  applicationTags: z.array(z.enum(vehicleApplicationTags)),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  images: z.array(vehicleImageSchema).min(1),
  keySpecs: vehicleKeySpecsSchema.optional(),
  specificationGroups: z.array(vehicleSpecificationGroupSchema),
  applications: z.array(nonEmptyString),
  configurations: z.array(nonEmptyString).optional(),
  brochure: vehicleBrochureSchema.optional(),
  brochureUrl: nonEmptyString.optional(),
  source: vehicleSourceSchema.optional(),
  importMetadata: vehicleImportMetadataSchema.optional(),
  normalization: z.object({
    decisions: z.array(z.object({
      field: nonEmptyString,
      rawValue: z.unknown().optional(),
      normalizedValue: z.unknown().optional(),
      reason: nonEmptyString,
    })).optional(),
    warnings: z.array(z.object({
      severity: z.enum(["warning", "error"]),
      field: nonEmptyString.optional(),
      message: nonEmptyString,
      code: nonEmptyString.optional(),
    })).optional(),
  }).optional(),
  seo: z.object({ title: nonEmptyString.optional(), description: nonEmptyString.optional(), image: nonEmptyString.optional() }).optional(),
  featured: z.boolean(),
  active: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
  createdAt: nonEmptyString,
  updatedAt: nonEmptyString,
  legacy: z.object({
    category: z.enum(["Light Duty", "Medium Duty", "Heavy Duty", "Passenger", "Trailer"]),
    bodyType: z.enum(["Cargo", "Dump Truck", "Tractor Head", "Bus", "Trailer", "Specialized / Custom"]),
  }).optional(),
}).superRefine((vehicle, context) => {
  if (vehicle.images.filter((image) => image.isPrimary).length !== 1) {
    context.addIssue({ code: "custom", path: ["images"], message: "Exactly one primary image is required." })
  }
})

export const vehicleInsertDocumentSchema = mongoVehicleDocumentSchema.omit({ _id: true }).extend({
  importMetadata: vehicleImportMetadataSchema.extend({ importedAt: z.date() }).optional(),
})

export type MongoVehicleDocumentInput = z.infer<typeof mongoVehicleDocumentSchema>
