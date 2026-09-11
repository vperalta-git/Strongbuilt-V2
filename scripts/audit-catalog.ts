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
  const importedGroups = await Promise.all(["isuzu", "asiastar", "shacman", "sinotruk", "faw", "forland", "yutong"].map(async (manufacturer) => {
    const filter = {
      "importMetadata.source": "manufacturer-import" as const,
      "importMetadata.manufacturer": { $regex: `^${manufacturer}$`, $options: "i" },
    }
    return {
      manufacturer,
      count: await getTrucksCollection(db).countDocuments(filter),
      fingerprint: await fingerprint(getTrucksCollection(db), filter),
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
