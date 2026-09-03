import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { ObjectId, type Collection, type Db, type Document, type Filter } from "mongodb"
import {
  getBrandsCollection,
  getInquiriesCollection,
  getQuoteRequestsCollection,
  getTrucksCollection,
  getTruckTypesCollection,
} from "@/lib/db/collections"
import { closeMongoConnection, getMongoDatabase } from "@/lib/db/mongodb"
import { getVehicleTypesCompatibilityCollection, resolveBrandIdsBySlug } from "@/lib/db/vehicles"
import {
  isuzuBrandSourceSchema,
  isuzuTestModels,
  isuzuTruckSourceSchema,
  normalizeIsuzuSourceRecord,
} from "@/lib/imports/isuzu"
import { stageVehicleImports } from "@/lib/imports/normalize-vehicle"
import {
  applyPromotionPlan,
  createInsertOnlyPromotionPlan,
  type ExistingVehicleIdentity,
  type PromotionBatchDefinition,
  type PromotionCandidate,
} from "@/lib/imports/vehicle-promotion"
import { loadLocalEnvironment } from "@/scripts/seed-helpers"
import { truckSeeds } from "@/scripts/seed-data"

const brandSourcePath = resolve("data/imports/raw/isuzu/isuzu_brands.json")
const truckSourcePath = resolve("data/imports/raw/isuzu/isuzu_trucks.json")
const reportPath = resolve("data/imports/reports/isuzu-n-series-promotion-plan.json")
const readTimeoutMs = 15_000

const definition: PromotionBatchDefinition = {
  batch: "isuzu-n-series-001",
  manufacturer: "ISUZU",
  allowedModels: isuzuTestModels,
  expectedCurrentTruckCount: 12,
  importVersion: 1,
}

type ProductionCounts = {
  brands: number
  trucks: number
  truckTypes: number
  inquiries: number
  quoteRequests: number
}

async function productionCounts(db: Db): Promise<ProductionCounts> {
  const [brands, trucks, truckTypes, inquiries, quoteRequests] = await Promise.all([
    getBrandsCollection(db).countDocuments({}, { maxTimeMS: readTimeoutMs }),
    getTrucksCollection(db).countDocuments({}, { maxTimeMS: readTimeoutMs }),
    getTruckTypesCollection(db).countDocuments({}, { maxTimeMS: readTimeoutMs }),
    getInquiriesCollection(db).countDocuments({}, { maxTimeMS: readTimeoutMs }),
    getQuoteRequestsCollection(db).countDocuments({}, { maxTimeMS: readTimeoutMs }),
  ])
  return { brands, trucks, truckTypes, inquiries, quoteRequests }
}

async function resolveCatalogDatabase(initialDatabase: Db) {
  const initialCounts = await productionCounts(initialDatabase)
  if (initialCounts.brands || initialCounts.trucks) return initialDatabase
  const databaseList = await initialDatabase.admin().listDatabases({ nameOnly: true })
  const candidates: Db[] = []
  for (const { name } of databaseList.databases) {
    if (["admin", "config", "local"].includes(name)) continue
    const candidate = initialDatabase.client.db(name)
    const counts = await productionCounts(candidate)
    if (counts.brands > 0 && counts.trucks > 0) candidates.push(candidate)
  }
  if (candidates.length !== 1) {
    throw new Error(`Unable to identify one production catalog database (matches: ${candidates.length}).`)
  }
  return candidates[0]
}

async function fingerprint<T extends Document>(collection: Collection<T>, filter: Filter<T> = {} as Filter<T>) {
  const documents = await collection.find(filter).sort({ _id: 1 }).maxTimeMS(readTimeoutMs).toArray()
  return createHash("sha256").update(JSON.stringify(documents)).digest("hex")
}

async function productionFingerprints(db: Db) {
  return {
    brands: await fingerprint(getBrandsCollection(db)),
    trucks: await fingerprint(getTrucksCollection(db)),
    truckTypes: await fingerprint(getTruckTypesCollection(db)),
    inquiries: await fingerprint(getInquiriesCollection(db)),
    quoteRequests: await fingerprint(getQuoteRequestsCollection(db)),
  }
}

async function readJson(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as unknown
}

function safetyChecks(
  base: Parameters<typeof createInsertOnlyPromotionPlan>[0],
  cleanPlan: ReturnType<typeof createInsertOnlyPromotionPlan>,
) {
  const unknownManufacturer = createInsertOnlyPromotionPlan({ ...base, requestedManufacturer: "UNKNOWN" })
  const unknownModel = createInsertOnlyPromotionPlan({ ...base, requestedModels: [...base.requestedModels, "UNKNOWN-MODEL"] })
  const unresolvedBrand = createInsertOnlyPromotionPlan({
    ...base,
    references: { ...base.references, brandId: undefined, brandName: undefined },
  })
  const firstCandidate = base.candidates[0]
  assert.ok(firstCandidate)
  const duplicateSlug = createInsertOnlyPromotionPlan({
    ...base,
    existingVehicles: [
      ...base.existingVehicles,
      {
        slug: firstCandidate.slug,
        model: "Different model",
        brandId: base.references.brandId || new ObjectId(),
      },
    ],
  })
  const secondCandidate = base.candidates[1]
  assert.ok(secondCandidate)
  const duplicateBatchModel = createInsertOnlyPromotionPlan({
    ...base,
    candidates: [firstCandidate, { ...secondCandidate, model: firstCandidate.model }, ...base.candidates.slice(2)],
  })
  const missingUniqueSlugIndex = createInsertOnlyPromotionPlan({ ...base, uniqueSlugIndex: false })
  const malformedCandidate: PromotionCandidate = {
    ...firstCandidate,
    staged: {
      ...firstCandidate.staged,
      normalized: undefined,
      status: "rejected",
      issues: [{ severity: "error", field: "slug", message: "Required", code: "INVALID_SOURCE_SHAPE" }],
    },
  }
  const malformedBatch = createInsertOnlyPromotionPlan({
    ...base,
    candidates: [malformedCandidate, ...base.candidates.slice(1)],
  })
  const nqr = cleanPlan.records.find((record) => record.model === "NQR75LS")

  return {
    missingApplyFlagPerformsZeroWrites: true,
    unknownManufacturerFails: !unknownManufacturer.applyAllowed && unknownManufacturer.batchErrors.some((entry) => entry.code === "UNKNOWN_MANUFACTURER"),
    unknownModelFails: !unknownModel.applyAllowed && unknownModel.batchErrors.some((entry) => entry.code === "UNKNOWN_MODEL"),
    unresolvedBrandFails: !unresolvedBrand.applyAllowed && unresolvedBrand.batchErrors.some((entry) => entry.code === "UNRESOLVED_BRAND"),
    duplicateSlugBlocksPromotion: !duplicateSlug.applyAllowed && duplicateSlug.records.some((record) => record.errors.some((entry) => entry.code === "PRODUCTION_SLUG_COLLISION")),
    duplicateBatchModelBlocksPromotion: !duplicateBatchModel.applyAllowed && duplicateBatchModel.records.some((record) => record.errors.some((entry) => entry.code === "BATCH_MODEL_COLLISION")),
    missingUniqueSlugIndexFails: !missingUniqueSlugIndex.applyAllowed && missingUniqueSlugIndex.batchErrors.some((entry) => entry.code === "MISSING_UNIQUE_SLUG_INDEX"),
    malformedRecordBlocksAtomicBatch: !malformedBatch.applyAllowed && malformedBatch.blocked === 1,
    nqrWarningRemainsNonBlocking: nqr?.promotionStatus === "eligible" && nqr.warnings.some((entry) => entry.code === "MANUFACTURER_SOURCE_WARNING"),
  }
}

async function main() {
  const apply = process.argv.includes("--apply")
  const unsupportedFlags = process.argv.slice(2).filter((argument) => argument !== "--apply")
  if (unsupportedFlags.length) throw new Error(`Unsupported promotion arguments: ${unsupportedFlags.join(", ")}.`)

  loadLocalEnvironment()
  if (process.env.MONGODB_DB === "[SENSITIVE]") delete process.env.MONGODB_DB
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === "[SENSITIVE]") {
    throw new Error("A local MONGODB_URI is required for promotion planning and production collision checks.")
  }

  const sourceBrands = isuzuBrandSourceSchema.array().parse(await readJson(brandSourcePath))
  const sourceTrucks = isuzuTruckSourceSchema.array().parse(await readJson(truckSourcePath))
  const sourceBrand = sourceBrands.find((brand) => brand.slug === "isuzu")
  assert.ok(sourceBrand, "Prepared ISUZU brand source is unavailable.")
  const allowedModels = new Set<string>(definition.allowedModels)
  const selected = sourceTrucks.filter((record) => allowedModels.has(record.model))
  assert.equal(selected.length, definition.allowedModels.length, "The prepared source does not contain the exact approved model set.")
  assert.deepEqual(new Set(selected.map((record) => record.model)), allowedModels, "The prepared source model identities differ from the approved whitelist.")

  console.log("Promotion check: connecting to the catalog database")
  const db = await resolveCatalogDatabase(await getMongoDatabase())
  process.env.MONGODB_DB = db.databaseName
  console.log("Promotion check: capturing production state")
  const before = await productionCounts(db)
  const fingerprintsBefore = await productionFingerprints(db)
  console.log("Promotion check: resolving brand, type, and collision constraints")
  const brandIds = await resolveBrandIdsBySlug(db, ["isuzu"])
  const brandId = brandIds.get("isuzu")
  const brand = brandId
    ? await getBrandsCollection(db).findOne({ _id: brandId }, { projection: { name: 1, slug: 1 } })
    : null
  const compatibilityType = await getVehicleTypesCompatibilityCollection(db).findOne(
    { slug: "cargo" },
    { projection: { name: 1, slug: 1 } },
  )
  const existingDocuments = await getTrucksCollection(db)
    .find({}, { projection: { slug: 1, model: 1, brandId: 1, displayOrder: 1 } })
    .maxTimeMS(readTimeoutMs)
    .toArray()
  const truckIndexes = await getTrucksCollection(db).listIndexes({ maxTimeMS: readTimeoutMs }).toArray()
  const uniqueSlugIndex = truckIndexes.some((index) => (
    index.unique === true && Object.keys(index.key).length === 1 && index.key.slug === 1
  ))
  const existingVehicles: ExistingVehicleIdentity[] = existingDocuments.map((document) => ({
    slug: document.slug,
    model: document.model,
    brandId: document.brandId,
  }))
  const startingDisplayOrder = Math.max(0, ...existingDocuments.map((document) => document.displayOrder || 0))

  const normalized = selected.map((record) => normalizeIsuzuSourceRecord(record, sourceBrand))
  const staged = stageVehicleImports(normalized.map((record) => record.input), {
    knownBrandSlugs: brand ? [brand.slug] : [],
  })
  const candidates: PromotionCandidate[] = selected.map((record, index) => ({
    raw: record,
    model: record.model,
    slug: record.slug,
    staged: staged.records[index],
    sourceIssues: normalized[index].issues,
    sourceDecisions: normalized[index].decisions,
  }))
  const planArgs: Parameters<typeof createInsertOnlyPromotionPlan>[0] = {
    definition,
    requestedManufacturer: "ISUZU",
    requestedModels: definition.allowedModels,
    candidates,
    references: {
      brandId: brandId || undefined,
      brandName: brand?.name,
      brandSlug: "isuzu",
      typeId: compatibilityType?._id,
      typeName: compatibilityType?.name,
      typeSlug: "cargo",
    },
    existingVehicles,
    currentTruckCount: before.trucks,
    startingDisplayOrder,
    uniqueSlugIndex,
    timestamp: new Date(),
  }
  const dryRunPlan = createInsertOnlyPromotionPlan(planArgs)
  console.log("Promotion check: exercising dry-run safety guards")
  const guards = safetyChecks(planArgs, dryRunPlan)
  assert.ok(Object.values(guards).every(Boolean), "A promotion safety guard failed.")
  const promotionSlugs = dryRunPlan.records.map((record) => record.slug)
  const seedSlugOverlap = truckSeeds.map((record) => record.slug).filter((slug) => promotionSlugs.includes(slug))
  assert.equal(seedSlugOverlap.length, 0, "The promotion batch overlaps a seed-owned truck slug.")

  let insertedIds: string[] = []
  if (apply) {
    if (!dryRunPlan.applyAllowed) throw new Error("Apply was requested, but the fresh promotion plan is blocked.")
    insertedIds = await applyPromotionPlan(db, dryRunPlan)
  }

  console.log("Promotion check: verifying production remained unchanged")
  const after = await productionCounts(db)
  const fingerprintsAfter = await productionFingerprints(db)
  if (!apply) {
    assert.deepEqual(after, before, "Dry run changed production collection counts.")
    assert.deepEqual(fingerprintsAfter, fingerprintsBefore, "Dry run changed production documents.")
  } else {
    assert.equal(after.trucks, before.trucks + dryRunPlan.eligible, "Apply did not produce the expected truck count.")
    assert.equal(after.brands, before.brands)
    assert.equal(after.truckTypes, before.truckTypes)
    assert.equal(after.inquiries, before.inquiries)
    assert.equal(after.quoteRequests, before.quoteRequests)
    assert.equal(fingerprintsAfter.brands, fingerprintsBefore.brands)
    assert.equal(fingerprintsAfter.truckTypes, fingerprintsBefore.truckTypes)
    assert.equal(fingerprintsAfter.inquiries, fingerprintsBefore.inquiries)
    assert.equal(fingerprintsAfter.quoteRequests, fingerprintsBefore.quoteRequests)
    const originalTruckFingerprintAfter = await fingerprint(getTrucksCollection(db), {
      slug: { $nin: promotionSlugs },
    })
    assert.equal(originalTruckFingerprintAfter, fingerprintsBefore.trucks, "An original truck document changed during promotion.")
  }

  const report = {
    generatedAt: new Date().toISOString(),
    batch: dryRunPlan.batch,
    manufacturer: dryRunPlan.manufacturer,
    mode: apply ? "apply" : "dry-run",
    eligible: dryRunPlan.eligible,
    blocked: dryRunPlan.blocked,
    applyAllowed: dryRunPlan.applyAllowed,
    currentTruckCount: dryRunPlan.currentTruckCount,
    expectedTruckCountAfterApply: dryRunPlan.expectedTruckCountAfterApply,
    productionCounts: { before, after },
    productionWritesPerformed: apply ? insertedIds.length : 0,
    resolvedRelationships: dryRunPlan.references,
    uniqueSlugIndex: dryRunPlan.uniqueSlugIndex,
    transactionPolicy: dryRunPlan.transactionPolicy,
    safetyGuards: guards,
    seedSafety: {
      originalSeedSlugCount: truckSeeds.length,
      promotionSlugOverlap: seedSlugOverlap,
      deletesUnknownSlugs: false,
      importedRecordsOwnedBySeed: seedSlugOverlap.length > 0,
      explanation: "The seed upserts only its original 12 known slugs and contains no delete operation, so separate manufacturer slugs are retained.",
    },
    postApplyVerificationDesign: [
      "Verify trucks count is 20 and every slug remains unique.",
      "Read back all eight ISUZU documents and rerun canonical validation.",
      "Confirm /api/trucks returns 20 MongoDB records.",
      "Confirm /trucks consumes all eight through the legacy adapter.",
      "Confirm each /trucks/[slug] route resolves and sitemap.xml includes every slug.",
      "Confirm request-a-quote snapshots use selectedTruck.truckId for inserted ObjectIds.",
      "Regression-check all original 12 slugs.",
    ],
    records: dryRunPlan.records.map((record) => ({
      model: record.model,
      slug: record.slug,
      resolvedBrand: dryRunPlan.references.brand,
      resolvedBrandId: dryRunPlan.references.brandId,
      resolvedType: dryRunPlan.references.legacyType,
      resolvedTypeId: dryRunPlan.references.typeId,
      taxonomy: record.canonicalPreview
        ? {
            vehicleFamily: record.canonicalPreview.vehicleFamily,
            bodyType: record.canonicalPreview.bodyType,
            dutyClass: record.canonicalPreview.dutyClass,
            propulsion: record.canonicalPreview.propulsion,
            applicationTags: record.canonicalPreview.applicationTags,
          }
        : null,
      promotionStatus: record.promotionStatus,
      warnings: record.warnings,
      errors: record.errors,
      sourceUrl: record.canonicalPreview?.source?.productUrl || null,
      imageStatus: record.imageStatus,
      importMetadata: record.canonicalPreview?.importMetadata || null,
      legacyCompatibility: record.legacyCompatibility,
    })),
  }

  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
  console.log(`ISUZU promotion ${report.mode}: ${report.eligible} eligible, ${report.blocked} blocked`)
  console.log(`Production writes performed: ${report.productionWritesPerformed}`)
  console.log(`Counts after command: ${JSON.stringify(after)}`)
  console.log(`Promotion plan: ${reportPath}`)
}

main()
  .catch((error: unknown) => {
    const rawMessage = error instanceof Error ? error.message : "Unknown ISUZU promotion failure."
    const uri = process.env.MONGODB_URI
    console.error(uri ? rawMessage.replaceAll(uri, "[redacted]") : rawMessage)
    process.exitCode = 1
  })
  .finally(closeMongoConnection)
