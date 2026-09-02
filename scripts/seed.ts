import { closeMongoConnection, getMongoDatabase, isMongoConfigured } from "@/lib/db/mongodb"
import {
  brandSeedSchema,
  industrySeedSchema,
  serviceSeedSchema,
  siteSettingsSeedSchema,
  truckSeedSchema,
  truckTypeSeedSchema,
} from "@/lib/validation/database"
import { getBrandsCollection, getIndustriesCollection, getServicesCollection, getSiteSettingsCollection, getTrucksCollection, getTruckTypesCollection } from "@/lib/db/collections"
import { brandSeeds, industrySeeds, serviceSeeds, siteSettingsSeed, truckSeeds, truckTypeSeeds } from "@/scripts/seed-data"
import { assertUnique, loadLocalEnvironment, type SeedReport } from "@/scripts/seed-helpers"
import { seedBrands } from "@/scripts/seed-brands"
import { seedIndustries } from "@/scripts/seed-industries"
import { prepareOperationalCollections } from "@/scripts/seed-operational-collections"
import { seedServices } from "@/scripts/seed-services"
import { seedSiteSettings } from "@/scripts/seed-site-settings"
import { seedTrucks } from "@/scripts/seed-trucks"
import { seedTruckTypes } from "@/scripts/seed-truck-types"

function report(label: string, result: SeedReport) {
  console.log(`${label}: ${result.count} synchronized (${result.inserted} inserted, ${result.updated} updated)`)
}

function validateSeedData() {
  const validated = {
    brands: brandSeedSchema.array().parse(brandSeeds),
    truckTypes: truckTypeSeedSchema.array().parse(truckTypeSeeds),
    trucks: truckSeedSchema.array().parse(truckSeeds),
    industries: industrySeedSchema.array().parse(industrySeeds),
    services: serviceSeedSchema.array().parse(serviceSeeds),
    siteSettings: siteSettingsSeedSchema.parse(siteSettingsSeed),
  }

  assertUnique(validated.brands.map((record) => record.slug), "brand slugs")
  assertUnique(validated.brands.map((record) => record.name), "brand names")
  assertUnique(validated.truckTypes.map((record) => record.slug), "truck-type slugs")
  assertUnique(validated.truckTypes.map((record) => record.name), "truck-type names")
  assertUnique(validated.trucks.map((record) => record.slug), "truck slugs")
  assertUnique(validated.industries.map((record) => record.slug), "industry slugs")
  assertUnique(validated.services.map((record) => record.slug), "service slugs")

  const brandSlugs = new Set(validated.brands.map((record) => record.slug))
  const typeSlugs = new Set(validated.truckTypes.map((record) => record.slug))
  for (const truck of validated.trucks) {
    if (!brandSlugs.has(truck.brandSlug)) throw new Error(`Truck ${truck.slug} has an unknown brand relationship.`)
    if (!typeSlugs.has(truck.typeSlug)) throw new Error(`Truck ${truck.slug} has an unknown truck-type relationship.`)
  }
  for (const industry of validated.industries) {
    for (const slug of industry.recommendedTruckTypeSlugs ?? []) {
      if (!typeSlugs.has(slug)) throw new Error(`Industry ${industry.slug} has an unknown truck-type relationship.`)
    }
  }

  return validated
}

async function verifySeed(db: Awaited<ReturnType<typeof getMongoDatabase>>, validated: ReturnType<typeof validateSeedData>) {
  const [brandCount, truckTypeCount, truckCount, industryCount, serviceCount, settingsCount] = await Promise.all([
    getBrandsCollection(db).countDocuments({ slug: { $in: validated.brands.map((record) => record.slug) } }),
    getTruckTypesCollection(db).countDocuments({ slug: { $in: validated.truckTypes.map((record) => record.slug) } }),
    getTrucksCollection(db).countDocuments({ slug: { $in: validated.trucks.map((record) => record.slug) } }),
    getIndustriesCollection(db).countDocuments({ slug: { $in: validated.industries.map((record) => record.slug) } }),
    getServicesCollection(db).countDocuments({ slug: { $in: validated.services.map((record) => record.slug) } }),
    getSiteSettingsCollection(db).countDocuments({ _id: "main" }),
  ])

  const expected = [
    ["brands", brandCount, validated.brands.length],
    ["truck types", truckTypeCount, validated.truckTypes.length],
    ["trucks", truckCount, validated.trucks.length],
    ["industries", industryCount, validated.industries.length],
    ["services", serviceCount, validated.services.length],
    ["site settings", settingsCount, 1],
  ] as const
  for (const [label, actual, wanted] of expected) {
    if (actual !== wanted) throw new Error(`Seed verification failed for ${label}: expected ${wanted}, found ${actual}.`)
  }

  const seededTrucks = await getTrucksCollection(db)
    .find({ slug: { $in: validated.trucks.map((record) => record.slug) } }, { projection: { brandId: 1, typeId: 1 } })
    .toArray()
  const brandIds = new Set((await getBrandsCollection(db).find({}, { projection: { _id: 1 } }).toArray()).map((record) => record._id.toHexString()))
  const typeIds = new Set((await getTruckTypesCollection(db).find({}, { projection: { _id: 1 } }).toArray()).map((record) => record._id.toHexString()))
  for (const truck of seededTrucks) {
    if (!brandIds.has(truck.brandId.toHexString()) || !typeIds.has(truck.typeId.toHexString())) {
      throw new Error("Seed verification found a truck with an invalid brand or truck-type reference.")
    }
  }

  const duplicateChecks = await Promise.all([
    getBrandsCollection(db).aggregate([{ $group: { _id: "$slug", count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]).toArray(),
    getTruckTypesCollection(db).aggregate([{ $group: { _id: "$slug", count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]).toArray(),
    getTrucksCollection(db).aggregate([{ $group: { _id: "$slug", count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]).toArray(),
    getIndustriesCollection(db).aggregate([{ $group: { _id: "$slug", count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]).toArray(),
    getServicesCollection(db).aggregate([{ $group: { _id: "$slug", count: { $sum: 1 } } }, { $match: { count: { $gt: 1 } } }]).toArray(),
  ])
  if (duplicateChecks.some((duplicates) => duplicates.length)) throw new Error("Seed verification found duplicate slugs.")
}

export async function runSeed({ loadEnvironment = true } = {}) {
  if (loadEnvironment) loadLocalEnvironment()

  try {
    const validated = validateSeedData()
    if (!isMongoConfigured()) throw new Error("MONGODB_URI is not configured. Add it to .env.local before running the seed.")
    const db = await getMongoDatabase()
    const timestamp = new Date()

    console.log("Strongbuilt database seed\n")
    const operationalCounts = await prepareOperationalCollections(db)
    const brandResult = await seedBrands(db, validated.brands, timestamp)
    const truckTypeResult = await seedTruckTypes(db, validated.truckTypes, timestamp)
    const truckResult = await seedTrucks(db, validated.trucks, brandResult.ids, truckTypeResult.ids, timestamp)
    const industryResult = await seedIndustries(db, validated.industries, truckTypeResult.ids, timestamp)
    const serviceResult = await seedServices(db, validated.services, timestamp)
    const siteSettingsResult = await seedSiteSettings(db, validated.siteSettings, timestamp)

    await verifySeed(db, validated)

    report("Brands", brandResult)
    report("Truck Types", truckTypeResult)
    report("Trucks", truckResult)
    report("Industries", industryResult)
    report("Services", serviceResult)
    report("Site Settings", siteSettingsResult)
    console.log(`Existing inquiries preserved: ${operationalCounts.inquiries}`)
    console.log(`Existing quote requests preserved: ${operationalCounts.quoteRequests}`)
    console.log("\nSeed completed successfully.")
  } finally {
    await closeMongoConnection()
  }
}
