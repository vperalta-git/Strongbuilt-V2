import assert from "node:assert/strict"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { getBrandsCollection, getInquiriesCollection, getQuoteRequestsCollection, getTrucksCollection, getTruckTypesCollection } from "@/lib/db/collections"
import { closeMongoConnection, getMongoDatabase } from "@/lib/db/mongodb"
import { catalogCounts, fingerprint, resolveCatalogDatabase } from "@/lib/imports/core/database"
import { loadManufacturerSource } from "@/lib/imports/core/loader"
import { getManufacturerConfiguration } from "@/lib/imports/core/registry"
import { resolveManufacturerBrand } from "@/lib/imports/core/relationships"
import { loadLocalEnvironment } from "@/scripts/seed-helpers"

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

async function protectedFingerprints(db: Awaited<ReturnType<typeof getMongoDatabase>>, targetSlug: string) {
  return {
    otherBrands: await fingerprint(getBrandsCollection(db), { slug: { $ne: targetSlug } }),
    trucks: await fingerprint(getTrucksCollection(db)),
    truckTypes: await fingerprint(getTruckTypesCollection(db)),
    inquiries: await fingerprint(getInquiriesCollection(db)),
    quoteRequests: await fingerprint(getQuoteRequestsCollection(db)),
  }
}

async function main() {
  const manufacturer = process.argv[2]
  if (!manufacturer || manufacturer.startsWith("--")) throw new Error("Provide a manufacturer slug.")
  const apply = process.argv.includes("--apply")
  const config = getManufacturerConfiguration(manufacturer)
  const source = await loadManufacturerSource(config)
  const parsed = source.brandRecords.map((record) => config.adapter.parseBrand(record)).find((result) => result.success)
  if (!parsed?.success) throw new Error(`${config.displayName} source brand is invalid.`)

  loadLocalEnvironment()
  if (process.env.MONGODB_DB === "[SENSITIVE]") delete process.env.MONGODB_DB
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === "[SENSITIVE]") throw new Error("A local MONGODB_URI is required.")
  const db = await resolveCatalogDatabase(await getMongoDatabase())
  process.env.MONGODB_DB = db.databaseName
  const before = await catalogCounts(db)
  const fingerprintsBefore = await protectedFingerprints(db, config.slug)
  const existing = await resolveManufacturerBrand(db, config)
  const sourceBrand = parsed.data as Record<string, unknown>
  const logo = sourceBrand.logo && typeof sourceBrand.logo === "object" ? sourceBrand.logo as Record<string, unknown> : {}
  const sourceMetadata = sourceBrand.source && typeof sourceBrand.source === "object" ? sourceBrand.source as Record<string, unknown> : {}
  const officialWebsite = stringValue(sourceBrand.officialWebsite)
  if (!officialWebsite) throw new Error(`${config.displayName} source brand has no official website.`)
  const aliases = [...new Set([sourceBrand.slug, sourceBrand.name, ...config.brandAliases].map(stringValue).filter((value): value is string => Boolean(value)))]
  const proposed = {
    name: parsed.data.name,
    slug: config.slug,
    aliases,
    officialWebsite,
    ...(stringValue(sourceBrand.description) ? { description: stringValue(sourceBrand.description) } : {}),
    logoMetadata: {
      ...(stringValue(logo.url) ? { url: stringValue(logo.url) } : {}),
      alt: stringValue(logo.alt) || `${parsed.data.name} logo`,
      ...(stringValue(logo.localPathSuggested) ? { suggestedLocalPath: stringValue(logo.localPathSuggested) } : {}),
      ...(stringValue(logo.status) ? { status: stringValue(logo.status) } : {}),
    },
    source: {
      website: officialWebsite,
      verifiedAt: new Date(stringValue(sourceMetadata.verifiedAt) || new Date().toISOString()),
    },
    active: sourceBrand.active === false ? false : true,
    displayOrder: typeof sourceBrand.displayOrder === "number" ? sourceBrand.displayOrder : before.brands + 1,
  }

  let action: "reused" | "inserted" | "planned" = existing.id ? "reused" : "planned"
  let objectId = existing.id?.toHexString() || null
  if (!existing.id && apply) {
    const indexes = await getBrandsCollection(db).listIndexes().toArray()
    assert.ok(indexes.some((index) => index.unique === true && Object.keys(index.key).length === 1 && index.key.slug === 1), "The unique brands.slug index is required.")
    const timestamp = new Date()
    const session = db.client.startSession()
    try {
      await session.withTransaction(async () => {
        const recheck = await resolveManufacturerBrand(db, config)
        if (recheck.id) throw new Error("The manufacturer brand appeared after planning; transaction aborted.")
        const result = await getBrandsCollection(db).insertOne({ ...proposed, createdAt: timestamp, updatedAt: timestamp }, { session })
        objectId = result.insertedId.toHexString()
      }, { readConcern: { level: "snapshot" }, writeConcern: { w: "majority" } })
    } finally {
      await session.endSession()
    }
    action = "inserted"
  }

  const resolved = await resolveManufacturerBrand(db, config)
  if (apply) {
    assert.ok(resolved.id, "Brand did not resolve after apply.")
    assert.equal(await getBrandsCollection(db).countDocuments({ slug: resolved.slug }), 1, "Brand setup is not idempotent.")
  }
  const after = await catalogCounts(db)
  const fingerprintsAfter = await protectedFingerprints(db, config.slug)
  assert.deepEqual(fingerprintsAfter, fingerprintsBefore, "A protected collection changed during brand setup.")
  assert.equal(after.trucks, before.trucks)
  assert.equal(after.uniqueTruckSlugs, before.uniqueTruckSlugs)
  assert.equal(after.inquiries, before.inquiries)
  assert.equal(after.quoteRequests, before.quoteRequests)
  assert.equal(after.brands, before.brands + (action === "inserted" ? 1 : 0))

  const report = { manufacturer: config.slug, generatedAt: new Date().toISOString(), mode: apply ? "apply" : "dry-run", action, objectId: objectId || resolved.id?.toHexString() || null, proposed, countsBefore: before, countsAfter: after, protectedCollectionsUnchanged: true, idempotent: Boolean(resolved.id || existing.id) }
  const reportPath = resolve(`data/imports/reports/${config.slug}/brand-setup.json`)
  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
  console.log(`${config.displayName} brand: ${action}${report.objectId ? ` (${report.objectId})` : ""}`)
  console.log(`counts: ${JSON.stringify(after)}`)
  console.log(`report: ${reportPath}`)
}

void main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown brand setup failure."
    console.error(process.env.MONGODB_URI ? message.replaceAll(process.env.MONGODB_URI, "[redacted]") : message)
    process.exitCode = 1
  })
  .finally(closeMongoConnection)
