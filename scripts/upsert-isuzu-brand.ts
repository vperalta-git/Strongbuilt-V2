import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import type { Collection, Db, Document, Filter } from "mongodb"
import {
  getBrandsCollection,
  getInquiriesCollection,
  getQuoteRequestsCollection,
  getTrucksCollection,
  getTruckTypesCollection,
} from "@/lib/db/collections"
import { closeMongoConnection, getMongoDatabase } from "@/lib/db/mongodb"
import { isuzuBrandSourceSchema } from "@/lib/imports/isuzu"
import { loadLocalEnvironment } from "@/scripts/seed-helpers"

const sourcePath = resolve("data/imports/raw/isuzu/isuzu_brands.json")
const reportPath = resolve("data/imports/reports/isuzu-brand-upsert.json")

type Counts = {
  brands: number
  trucks: number
  inquiries: number
  quoteRequests: number
}

async function counts(db: Db): Promise<Counts> {
  const [brands, trucks, inquiries, quoteRequests] = await Promise.all([
    getBrandsCollection(db).countDocuments({}),
    getTrucksCollection(db).countDocuments({}),
    getInquiriesCollection(db).countDocuments({}),
    getQuoteRequestsCollection(db).countDocuments({}),
  ])
  return { brands, trucks, inquiries, quoteRequests }
}

async function resolveCatalogDatabase(initialDatabase: Db) {
  const initialCounts = await counts(initialDatabase)
  if (initialCounts.brands || initialCounts.trucks) return initialDatabase

  const databaseList = await initialDatabase.admin().listDatabases({ nameOnly: true })
  const candidates: Db[] = []
  for (const { name } of databaseList.databases) {
    if (["admin", "config", "local"].includes(name)) continue
    const candidate = initialDatabase.client.db(name)
    const candidateCounts = await counts(candidate)
    if (candidateCounts.brands > 0 && candidateCounts.trucks > 0) candidates.push(candidate)
  }
  if (candidates.length !== 1) {
    throw new Error(`Unable to identify one production catalog database (matches: ${candidates.length}). Set MONGODB_DB locally to the protected Vercel value.`)
  }
  return candidates[0]
}

async function fingerprint<T extends Document>(collection: Collection<T>, filter: Filter<T> = {} as Filter<T>) {
  const documents = await collection.find(filter).sort({ _id: 1 }).toArray()
  return createHash("sha256").update(JSON.stringify(documents)).digest("hex")
}

async function protectedFingerprints(db: Db) {
  return {
    nonIsuzuBrands: await fingerprint(getBrandsCollection(db), { slug: { $ne: "isuzu" } }),
    trucks: await fingerprint(getTrucksCollection(db)),
    truckTypes: await fingerprint(getTruckTypesCollection(db)),
    inquiries: await fingerprint(getInquiriesCollection(db)),
    quoteRequests: await fingerprint(getQuoteRequestsCollection(db)),
  }
}

async function main() {
  if (!process.argv.includes("--confirm-brand-only")) {
    throw new Error("Refusing production write without --confirm-brand-only.")
  }

  loadLocalEnvironment()
  if (process.env.MONGODB_DB === "[SENSITIVE]") delete process.env.MONGODB_DB
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === "[SENSITIVE]") {
    throw new Error("A local MONGODB_URI is required for the approved ISUZU brand-only upsert.")
  }

  const rawSource = JSON.parse(await readFile(sourcePath, "utf8")) as unknown
  const [source] = isuzuBrandSourceSchema.array().parse(rawSource)
  assert.ok(source, "The prepared ISUZU brand source is empty.")
  assert.equal(source.slug, "isuzu")
  assert.equal(source.name, "ISUZU")

  const db = await resolveCatalogDatabase(await getMongoDatabase())
  const collection = getBrandsCollection(db)
  const before = await counts(db)
  const fingerprintsBefore = await protectedFingerprints(db)
  const equivalents = await collection.find({
    $or: [
      { slug: { $regex: "^isuzu$", $options: "i" } },
      { name: { $regex: "^isuzu$", $options: "i" } },
      { aliases: { $regex: "^isuzu$", $options: "i" } },
    ],
  }).toArray()
  if (equivalents.length > 1) throw new Error("Multiple logically equivalent ISUZU brand records already exist; no write performed.")
  if (equivalents[0] && equivalents[0].slug !== "isuzu") {
    throw new Error(`An equivalent ISUZU brand already exists with conflicting slug ${equivalents[0].slug}; no write performed.`)
  }

  const indexes = await collection.listIndexes().toArray()
  const slugIndex = indexes.find((index) => (
    index.unique === true && Object.keys(index.key).length === 1 && index.key.slug === 1
  ))
  assert.ok(slugIndex, "The required unique brands.slug index is missing; no write performed.")

  const timestamp = new Date()
  const normalized = {
    name: source.name,
    slug: source.slug,
    logoMetadata: {
      ...(source.logo.url ? { url: source.logo.url } : {}),
      alt: source.logo.alt,
      suggestedLocalPath: source.logo.localPathSuggested,
      status: source.logo.status,
    },
    officialWebsite: source.officialWebsite,
    description: source.description,
    active: source.active,
    displayOrder: source.displayOrder,
    source: {
      website: source.source.website,
      verifiedAt: new Date(source.source.verifiedAt),
    },
  }
  const operation = {
    $set: { ...normalized, updatedAt: timestamp },
    $setOnInsert: { createdAt: timestamp },
  }
  const first = await collection.updateOne({ slug: "isuzu" }, operation, { upsert: true })
  const second = await collection.updateOne({ slug: "isuzu" }, operation, { upsert: true })

  const resolved = await collection.findOne({ slug: "isuzu" })
  assert.ok(resolved?._id, "ISUZU could not be resolved after the approved upsert.")
  assert.equal(await collection.countDocuments({ slug: "isuzu" }), 1, "ISUZU brand upsert created a duplicate.")
  assert.equal(second.upsertedCount, 0, "The second idempotency execution inserted another brand.")
  assert.equal(second.matchedCount, 1, "The second idempotency execution did not match ISUZU.")

  const after = await counts(db)
  const fingerprintsAfter = await protectedFingerprints(db)
  const expectedBrandCount = equivalents.length ? before.brands : before.brands + 1
  assert.equal(after.brands, expectedBrandCount, "Unexpected brand count after ISUZU upsert.")
  assert.equal(after.trucks, before.trucks, "The trucks collection changed during the brand-only operation.")
  assert.equal(after.inquiries, before.inquiries, "The inquiries collection changed during the brand-only operation.")
  assert.equal(after.quoteRequests, before.quoteRequests, "The quoteRequests collection changed during the brand-only operation.")
  assert.deepEqual(fingerprintsAfter, fingerprintsBefore, "A protected document outside ISUZU changed during the brand-only operation.")

  const report = {
    generatedAt: timestamp.toISOString(),
    source: "data/imports/raw/isuzu/isuzu_brands.json",
    checkBeforeWrite: {
      brandCount: before.brands,
      equivalentExisted: equivalents.length === 1,
      conflictingEquivalent: false,
      uniqueSlugIndex: slugIndex.name,
    },
    result: {
      action: first.upsertedCount === 1 ? "inserted" : "updated",
      brandSlug: resolved.slug,
      brandName: resolved.name,
      objectId: resolved._id.toHexString(),
      logoUrl: resolved.logoMetadata?.url || null,
      logoStatus: resolved.logoMetadata?.status || null,
    },
    idempotency: {
      secondExecutionMatched: second.matchedCount === 1,
      secondExecutionInserted: second.upsertedCount,
      finalIsuzuDocumentCount: await collection.countDocuments({ slug: "isuzu" }),
      passed: second.matchedCount === 1 && second.upsertedCount === 0,
    },
    counts: { before, after },
    protectedCollectionsUnchanged: true,
  }

  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
  console.log(`ISUZU brand ${report.result.action}: ${report.result.objectId}`)
  console.log(`Idempotency check: ${report.idempotency.passed ? "PASS" : "FAIL"}`)
  console.log(`Production counts: ${JSON.stringify(after)}`)
  console.log(`Audit report: ${reportPath}`)
}

main()
  .catch((error: unknown) => {
    const rawMessage = error instanceof Error ? error.message : "Unknown ISUZU brand upsert failure."
    const uri = process.env.MONGODB_URI
    console.error(uri ? rawMessage.replaceAll(uri, "[redacted]") : rawMessage)
    process.exitCode = 1
  })
  .finally(closeMongoConnection)
