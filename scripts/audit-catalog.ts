import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { getBrandsCollection, getInquiriesCollection, getQuoteRequestsCollection, getTrucksCollection, getTruckTypesCollection } from "@/lib/db/collections"
import { closeMongoConnection, getMongoDatabase } from "@/lib/db/mongodb"
import { catalogCounts, fingerprint, resolveCatalogDatabase } from "@/lib/imports/core/database"
import { loadLocalEnvironment } from "@/scripts/seed-helpers"
import { truckSeeds } from "@/scripts/seed-data"

async function main() {
  loadLocalEnvironment()
  if (process.env.MONGODB_DB === "[SENSITIVE]") delete process.env.MONGODB_DB
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === "[SENSITIVE]") throw new Error("A local MONGODB_URI is required.")
  const db = await resolveCatalogDatabase(await getMongoDatabase())
  process.env.MONGODB_DB = db.databaseName
  const importedManufacturerGroups = [
    { manufacturer: "isuzu", storedNames: ["isuzu"] },
    { manufacturer: "asiastar", storedNames: ["asiastar"] },
    { manufacturer: "shacman", storedNames: ["shacman"] },
    { manufacturer: "sinotruk", storedNames: ["sinotruk", "sinotruck"] },
    { manufacturer: "faw", storedNames: ["faw", "faw trucks"] },
    { manufacturer: "forland", storedNames: ["forland"] },
    { manufacturer: "yutong", storedNames: ["yutong"] },
  ]
  const importedGroups = await Promise.all(importedManufacturerGroups.map(async ({ manufacturer, storedNames }) => {
    const filter = {
      "importMetadata.source": "manufacturer-import" as const,
      "importMetadata.manufacturer": { $in: storedNames.map((name) => new RegExp(`^${name}$`, "i")) },
    }
    const records = await getTrucksCollection(db).find(filter).toArray()
    const structurallyComplete = records.filter((record) =>
      record._id
      && record.slug
      && record.name
      && record.model
      && record.brandId
      && record.typeId
      && record.vehicleFamily
      && record.bodyType
      && record.propulsion
      && record.source?.productUrl
      && record.importMetadata?.batch
      && typeof record.active === "boolean"
      && record.createdAt instanceof Date
      && record.updatedAt instanceof Date
      && (record.specifications || record.specificationGroups || record.keySpecs),
    )
    return {
      manufacturer,
      count: records.length,
      fingerprint: await fingerprint(getTrucksCollection(db), filter),
      integrity: {
        uniqueIds: new Set(records.map((record) => record._id?.toHexString())).size,
        uniqueSlugs: new Set(records.map((record) => record.slug)).size,
        active: records.filter((record) => record.active).length,
        structurallyComplete: structurallyComplete.length,
        localImageRecords: records.filter((record) => record.images.some((image) => image.storageProvider === "local")).length,
        fallbackImageRecords: records.filter((record) => record.images.length === 0).length,
        sourceWarningRecords: records.filter((record) => (record.source?.dataWarnings?.length || 0) > 0).length,
        normalizationWarningRecords: records.filter((record) => (record.normalization?.warnings?.length || 0) > 0).length,
        brandIds: [...new Set(records.map((record) => record.brandId.toHexString()))].sort(),
        typeIds: [...new Set(records.map((record) => record.typeId.toHexString()))].sort(),
        batches: [...new Set(records.map((record) => record.importMetadata?.batch).filter(Boolean))].sort(),
      },
    }
  }))
  const brandDocuments = await getBrandsCollection(db)
    .find({}, { projection: { _id: 1, name: 1, slug: 1, aliases: 1 } })
    .sort({ slug: 1 })
    .toArray()
  const report = {
    generatedAt: new Date().toISOString(),
    database: db.databaseName,
    counts: await catalogCounts(db),
    fingerprints: {
      seedOwned: await fingerprint(getTrucksCollection(db), { slug: { $in: truckSeeds.map((seed) => seed.slug) } }),
      allTrucks: await fingerprint(getTrucksCollection(db)),
      brands: await fingerprint(getBrandsCollection(db)),
      truckTypes: await fingerprint(getTruckTypesCollection(db)),
      inquiries: await fingerprint(getInquiriesCollection(db)),
      quoteRequests: await fingerprint(getQuoteRequestsCollection(db)),
    },
    seedOwnedCount: await getTrucksCollection(db).countDocuments({ slug: { $in: truckSeeds.map((seed) => seed.slug) } }),
    importedGroups,
    brands: brandDocuments.map((brand) => ({ _id: brand._id.toHexString(), name: brand.name, slug: brand.slug, aliases: brand.aliases || [] })),
  }
  console.log(JSON.stringify(report, null, 2))
  const reportFlag = process.argv.indexOf("--report")
  if (reportFlag >= 0) {
    const requestedPath = process.argv[reportFlag + 1]
    if (!requestedPath || requestedPath.startsWith("--")) throw new Error("--report requires a repository-relative output path.")
    const reportPath = resolve(requestedPath)
    await mkdir(dirname(reportPath), { recursive: true })
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
  }
}

void main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown catalog audit failure."
    console.error(process.env.MONGODB_URI ? message.replaceAll(process.env.MONGODB_URI, "[redacted]") : message)
    process.exitCode = 1
  })
  .finally(closeMongoConnection)
