import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import type { Db } from "mongodb"
import { vehicleBodyTypes, vehicleDutyClasses, vehicleFamilies, vehiclePropulsions } from "@/lib/domain/vehicle-taxonomy"
import {
  getBrandsCollection,
  getInquiriesCollection,
  getQuoteRequestsCollection,
  getTrucksCollection,
  getTruckTypesCollection,
} from "@/lib/db/collections"
import { closeMongoConnection, getMongoDatabase } from "@/lib/db/mongodb"
import type { ManufacturerImportIssue, ManufacturerNormalizationResult } from "@/lib/imports/core/types"
import { catalogCounts, fingerprint, resolveCatalogDatabase } from "@/lib/imports/core/database"
import { loadManufacturerSource } from "@/lib/imports/core/loader"
import { getManufacturerConfiguration } from "@/lib/imports/core/registry"
import { resolveLegacyTypes, resolveManufacturerBrand } from "@/lib/imports/core/relationships"
import { stageVehicleImports, type StagedVehicleImport } from "@/lib/imports/normalize-vehicle"
import {
  applyPromotionPlan,
  createInsertOnlyPromotionPlan,
  type ExistingVehicleIdentity,
  type PromotionCandidate,
} from "@/lib/imports/vehicle-promotion"
import { loadLocalEnvironment } from "@/scripts/seed-helpers"
import { truckSeeds } from "@/scripts/seed-data"

export type ManufacturerCommandMode = "validate" | "promote"

export type ManufacturerCommandOptions = {
  mode: ManufacturerCommandMode
  manufacturer: string
  models?: string[]
  batchId?: string
  apply?: boolean
}

function normalizeModel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ")
}

function rejectedStage(index: number, raw: unknown, issues: ManufacturerImportIssue[]): StagedVehicleImport {
  return { index, raw, normalizationDecisions: [], issues, status: "rejected" }
}

async function isuzuImportedFingerprints(db: Db) {
  const imported = await getTrucksCollection(db)
    .find({ "importMetadata.source": "manufacturer-import" })
    .sort({ slug: 1 })
    .toArray()
  const records = imported.filter((record) => record.importMetadata?.manufacturer.trim().toLowerCase() === "isuzu")
  return Object.fromEntries(records.map((record) => [
    record.slug,
    createHash("sha256").update(JSON.stringify(record)).digest("hex"),
  ]))
}

async function safetyFingerprints(db: Db) {
  return {
    brands: await fingerprint(getBrandsCollection(db)),
    trucks: await fingerprint(getTrucksCollection(db)),
    truckTypes: await fingerprint(getTruckTypesCollection(db)),
    inquiries: await fingerprint(getInquiriesCollection(db)),
    quoteRequests: await fingerprint(getQuoteRequestsCollection(db)),
  }
}

function imageInspection(normalized: ManufacturerNormalizationResult | undefined) {
  return normalized?.input.images.map((image) => {
    const suggested = image.suggestedLocalPath
    const localExists = Boolean(suggested?.startsWith("/") && existsSync(resolve("public", suggested.slice(1))))
    return {
      sourceUrl: image.sourceUrl || image.url,
      sourcePage: image.sourcePage || normalized.input.source.productUrl,
      storageProvider: image.storageProvider || "external",
      suggestedLocalPath: suggested || null,
      localAssetExists: localExists,
      status: localExists ? "LOCAL_ASSET_READY" : suggested ? "LOCAL_MIGRATION_REQUIRED" : "NO_LOCAL_PATH_PLANNED",
    }
  }) || []
}

function sourceSnapshot(raw: unknown) {
  if (!raw || typeof raw !== "object") return null
  const value = raw as Record<string, unknown>
  const keySpecs = value.keySpecs && typeof value.keySpecs === "object" ? value.keySpecs as Record<string, unknown> : {}
  return {
    productLine: value.productLine || null,
    category: value.category || null,
    dutyClassification: value.class || null,
    configurations: Array.isArray(value.configurations) ? value.configurations : [],
    applications: Array.isArray(value.applications) ? value.applications : [],
    gvwKg: keySpecs.gvwKg || null,
    propulsion: keySpecs.fuelType || null,
    legacyTypeHint: value.truckTypeSlug || null,
  }
}

function reportPath(manufacturer: string, filename: string) {
  return resolve(`data/imports/reports/${manufacturer}/${filename}`)
}

async function writeReport(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

export async function runManufacturerCommand(options: ManufacturerCommandOptions) {
  if (options.apply && options.mode !== "promote") throw new Error("--apply is only valid for promote:manufacturer.")
  const config = getManufacturerConfiguration(options.manufacturer)
  const source = await loadManufacturerSource(config)
  const parsedBrands = source.brandRecords.map((record) => config.adapter.parseBrand(record))
  const sourceBrand = parsedBrands.find((result) => result.success && (
    result.data.slug.trim().toLowerCase() === config.slug ||
    config.brandAliases.some((alias) => alias.trim().toLowerCase() === result.data.name.trim().toLowerCase())
  ))
  if (!sourceBrand?.success) throw new Error(`${config.displayName} source does not contain its configured brand record.`)

  const adapted = source.vehicleRecords.map((record) => config.adapter.normalizeVehicle(record, sourceBrand.data))
  const availableModels = adapted.flatMap((record) => record.success
    ? [record.input.model || record.input.name]
    : record.model ? [record.model] : [])
  if (options.models?.length && options.batchId) throw new Error("Use either --models or --batch, not both.")
  const batchModels = options.batchId ? config.reviewedBatches?.[options.batchId] : undefined
  if (options.batchId && !batchModels) {
    throw new Error(`Unknown reviewed batch "${options.batchId}" for ${config.displayName}.`)
  }
  if (options.apply && !options.batchId) throw new Error("Apply requires a stable reviewed --batch selector.")
  const selectionModels = batchModels || options.models
  const requestedSet = selectionModels?.length ? new Set(selectionModels.map(normalizeModel)) : undefined
  if (requestedSet) {
    const missing = [...requestedSet].filter((requested) => !availableModels.some((model) => normalizeModel(model) === requested))
    if (missing.length) throw new Error(`Requested models were not found in source: ${missing.join(", ")}.`)
  }
  const selectedIndexes = adapted.flatMap((record, index) => {
    const model = record.success ? record.input.model || record.input.name : record.model
    return !requestedSet || (model && requestedSet.has(normalizeModel(model))) ? [index] : []
  })
  const selected = selectedIndexes.map((index) => adapted[index])

  loadLocalEnvironment()
  if (process.env.MONGODB_DB === "[SENSITIVE]") delete process.env.MONGODB_DB
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === "[SENSITIVE]") {
    throw new Error("A local MONGODB_URI is required for read-only relationship and collision checks.")
  }

  const db = await resolveCatalogDatabase(await getMongoDatabase())
  process.env.MONGODB_DB = db.databaseName
  const before = await catalogCounts(db)
  const fingerprintsBefore = await safetyFingerprints(db)
  const importedBefore = await isuzuImportedFingerprints(db)
  const brand = await resolveManufacturerBrand(db, config)

  const validSelected = selected.filter((record): record is Extract<typeof record, { success: true }> => record.success)
  const typeResolutions = await resolveLegacyTypes(db, config, validSelected.map((record) => record.legacyTypeSlug))
  const availableLegacyTypes = await getTruckTypesCollection(db)
    .find({}, { projection: { _id: 0, name: 1, slug: 1, vehicleFamily: 1, canonicalBodyType: 1 } })
    .sort({ displayOrder: 1 })
    .toArray()
  const stagedValid = stageVehicleImports(validSelected.map((record) => record.input), {
    knownBrandSlugs: brand.id ? [brand.slug] : [],
  })
  let validIndex = 0
  const candidates: PromotionCandidate[] = selected.map((record, index) => {
    if (!record.success) {
      return {
        raw: source.vehicleRecords[selectedIndexes[index]],
        model: record.model || `invalid-record-${selectedIndexes[index] + 1}`,
        slug: record.slug || `invalid-record-${selectedIndexes[index] + 1}`,
        staged: rejectedStage(index, source.vehicleRecords[selectedIndexes[index]], []),
        sourceIssues: record.issues,
        sourceDecisions: [],
      }
    }
    const staged = stagedValid.records[validIndex++]
    const familyIssues: ManufacturerImportIssue[] = config.allowedVehicleFamilies.includes(record.input.vehicleFamily)
      ? []
      : [{ severity: "error", field: "vehicleFamily", message: `Vehicle family ${record.input.vehicleFamily} is not allowed for ${config.displayName}.`, reason: "Manufacturer registry family constraint failed.", code: "UNSUPPORTED_MANUFACTURER_FAMILY" }]
    return {
      raw: source.vehicleRecords[selectedIndexes[index]],
      model: record.input.model || record.input.name,
      slug: record.input.slug,
      staged,
      sourceIssues: [...record.issues, ...familyIssues],
      sourceDecisions: record.decisions,
      resolvedType: typeResolutions.get(record.legacyTypeSlug),
    }
  })

  const existingDocuments = await getTrucksCollection(db)
    .find({}, { projection: { slug: 1, model: 1, brandId: 1, displayOrder: 1, "source.productUrl": 1 } })
    .toArray()
  const existingVehicles: ExistingVehicleIdentity[] = existingDocuments.map((document) => ({
    slug: document.slug,
    model: document.model,
    brandId: document.brandId,
    sourceProductUrl: document.source?.productUrl,
  }))
  const uniqueSlugIndex = (await getTrucksCollection(db).listIndexes().toArray()).some((index) => (
    index.unique === true && Object.keys(index.key).length === 1 && index.key.slug === 1
  ))
  const selectedModels = candidates.map((candidate) => candidate.model)
  const timestamp = new Date()
  const plan = createInsertOnlyPromotionPlan({
    definition: {
      batch: options.batchId || `${config.slug}-${timestamp.toISOString().slice(0, 10)}`,
      manufacturer: config.displayName,
      allowedModels: selectionModels || availableModels,
      importVersion: config.importVersion,
    },
    requestedManufacturer: config.displayName,
    requestedModels: selectedModels,
    candidates,
    references: {
      brandId: brand.id,
      brandName: brand.name,
      brandSlug: brand.slug,
      typeSlug: "per-record",
    },
    existingVehicles,
    currentTruckCount: before.trucks,
    startingDisplayOrder: Math.max(0, ...existingDocuments.map((document) => document.displayOrder || 0)),
    uniqueSlugIndex,
    timestamp,
  })

  let insertedIds: string[] = []
  if (options.apply) insertedIds = await applyPromotionPlan(db, plan)

  const after = await catalogCounts(db)
  const fingerprintsAfter = await safetyFingerprints(db)
  const importedAfter = await isuzuImportedFingerprints(db)
  if (!options.apply) {
    assert.deepEqual(after, before, "Dry run changed database counts.")
    assert.deepEqual(fingerprintsAfter, fingerprintsBefore, "Dry run changed database documents.")
    assert.deepEqual(importedAfter, importedBefore, "Dry run changed an existing imported ISUZU document.")
  }

  const normalizedByIndex = new Map(selectedIndexes.map((sourceIndex, index) => [
    index,
    adapted[sourceIndex].success ? adapted[sourceIndex] as ManufacturerNormalizationResult & { success: true } : undefined,
  ]))
  const reportRecords = plan.records.map((record, index) => ({
    model: record.model,
    slug: record.slug,
    status: record.promotionStatus === "already-exists" ? "ALREADY_EXISTS" : record.promotionStatus === "eligible" ? (record.warnings.length ? "WARNING" : "PASS") : "ERROR",
    promotionEligible: record.promotionStatus === "eligible",
    sourceInventory: sourceSnapshot(candidates[index].raw),
    warnings: record.warnings,
    errors: record.errors,
    brandResolution: { slug: brand.slug, name: brand.name || null, resolved: Boolean(brand.id), matchedBy: brand.matchedBy || null },
    typeResolution: candidates[index].resolvedType
      ? { resolved: true, ...candidates[index].resolvedType, id: candidates[index].resolvedType?.id.toHexString() }
      : { resolved: false },
    taxonomy: (() => {
      const normalized = record.canonicalPreview || normalizedByIndex.get(index)?.input
      return normalized ? {
        vehicleFamily: normalized.vehicleFamily,
        bodyType: normalized.bodyType,
        dutyClass: normalized.dutyClass,
        propulsion: normalized.propulsion,
        applicationTags: normalized.applicationTags,
      } : null
    })(),
    source: record.canonicalPreview?.source || normalizedByIndex.get(index)?.input.source || null,
    images: imageInspection(normalizedByIndex.get(index)),
    legacyCompatibility: record.legacyCompatibility,
  }))
  const warningCount = reportRecords.reduce((total, record) => total + record.warnings.length, 0)
  const errorCount = reportRecords.reduce((total, record) => total + record.errors.length, 0) + plan.batchErrors.length
  const imageSummary = {
    imagesTested: reportRecords.reduce((total, record) => total + record.images.length, 0),
    localAssetsReady: reportRecords.flatMap((record) => record.images).filter((image) => image.localAssetExists).length,
    localMigrationRequired: reportRecords.flatMap((record) => record.images).filter((image) => image.status === "LOCAL_MIGRATION_REQUIRED").length,
    missingImageRecords: reportRecords.filter((record) => record.images.length === 0).length,
  }
  const frontendCompatibility = {
    recordsTested: reportRecords.length,
    recordsPassed: reportRecords.filter((record) => (
      record.legacyCompatibility.passed &&
      record.legacyCompatibility.imagesExposed > 0 &&
      record.legacyCompatibility.quoteSnapshotCompatible
    )).length,
    surfaces: {
      catalogList: "legacy Truck projection",
      detailRoute: "slug and legacy Truck projection",
      search: "brand, model, category, bodyType, and application fields",
      filters: "brand plus resolved legacy type/body fields",
      sorting: "name, model, and displayOrder fields",
      requestQuote: "selectedTruck.truckId ObjectId snapshot",
    },
  }
  const report = {
    manufacturer: config.slug,
    displayName: config.displayName,
    generatedAt: timestamp.toISOString(),
    mode: options.apply ? "apply" : options.mode === "promote" ? "dry-run" : "validation",
    sourceFiles: source.files,
    selection: { batchId: options.batchId || null, requestedModels: selectionModels || "all", sourceRecords: source.vehicleRecords.length, recordsTested: selected.length },
    summary: {
      recordsLoaded: selected.length,
      recordsNormalized: selected.filter((record) => record.success).length,
      eligible: plan.eligible,
      warnings: warningCount,
      errors: errorCount,
      alreadyExists: plan.alreadyExists,
      expectedInserts: plan.applyAllowed ? plan.eligible : 0,
      expectedUpdates: 0,
      expectedDeletes: 0,
    },
    batchEligibility: { applyAllowed: plan.applyAllowed, blocked: plan.blocked, batchErrors: plan.batchErrors },
    brandResolution: { slug: brand.slug, name: brand.name || null, resolved: Boolean(brand.id), matchedBy: brand.matchedBy || null, hardCodedObjectId: false },
    typeCompatibility: {
      requestedSourceTypes: [...new Set(validSelected.map((record) => record.legacyTypeSlug))],
      resolvedSourceTypes: [...typeResolutions.keys()],
      allResolved: validSelected.every((record) => typeResolutions.has(record.legacyTypeSlug)),
      availableLegacyTypes,
    },
    canonicalTaxonomy: {
      vehicleFamilies,
      bodyTypes: vehicleBodyTypes,
      dutyClasses: vehicleDutyClasses,
      propulsions: vehiclePropulsions,
    },
    duplicateChecks: {
      alreadyExists: plan.alreadyExists,
      batchSlugErrors: reportRecords.filter((record) => record.errors.some((issue) => issue.code === "BATCH_SLUG_COLLISION")).length,
      batchModelErrors: reportRecords.filter((record) => record.errors.some((issue) => issue.code === "BATCH_MODEL_COLLISION")).length,
      productionIdentityConflicts: reportRecords.filter((record) => record.errors.some((issue) => issue.code?.startsWith("PRODUCTION_"))).length,
      sharedOfficialProductUrls: Object.values(reportRecords.reduce<Record<string, number>>((counts, record) => {
        const url = record.source?.productUrl
        if (url) counts[url] = (counts[url] || 0) + 1
        return counts
      }, {})).filter((count) => count > 1).length,
    },
    imageStatus: imageSummary,
    frontendCompatibility: {
      ...frontendCompatibility,
      allPassed: frontendCompatibility.recordsPassed === frontendCompatibility.recordsTested,
    },
    promotion: {
      writesPerformed: insertedIds.length,
      expectedInserts: plan.applyAllowed ? plan.eligible : 0,
      expectedUpdates: 0,
      expectedDeletes: 0,
      transactionPolicy: plan.transactionPolicy,
    },
    seedSafety: {
      seedOwnedSlugs: truckSeeds.length,
      selectedSeedSlugOverlap: candidates.filter((candidate) => truckSeeds.some((seed) => seed.slug === candidate.slug)).map((candidate) => candidate.slug),
      deletesUnknownSlugs: false,
      importerUpdatesExistingRecords: false,
    },
    dataSafety: {
      countsBefore: before,
      countsAfter: after,
      unchanged: JSON.stringify(before) === JSON.stringify(after) && JSON.stringify(fingerprintsBefore) === JSON.stringify(fingerprintsAfter),
      existingImportedFingerprintsUnchanged: JSON.stringify(importedBefore) === JSON.stringify(importedAfter),
      existingImportedRecordsFingerprinted: Object.keys(importedBefore).length,
      existingImportedFingerprintsBefore: importedBefore,
      existingImportedFingerprintsAfter: importedAfter,
    },
    records: reportRecords,
  }

  const validationPath = reportPath(config.slug, "validation.json")
  const promotionPath = reportPath(config.slug, "promotion-plan.json")
  const imagePath = reportPath(config.slug, "image-plan.json")
  await writeReport(options.mode === "validate" ? validationPath : promotionPath, report)
  await writeReport(imagePath, { manufacturer: config.slug, generatedAt: timestamp.toISOString(), summary: imageSummary, records: reportRecords.map(({ model, slug, images }) => ({ model, slug, images })) })

  console.log(`${config.displayName} ${report.mode}`)
  console.log(`records loaded: ${report.summary.recordsLoaded}`)
  console.log(`records normalized: ${report.summary.recordsNormalized}`)
  console.log(`eligible: ${report.summary.eligible}`)
  console.log(`warnings: ${report.summary.warnings}`)
  console.log(`errors: ${report.summary.errors}`)
  console.log(`already exists: ${report.summary.alreadyExists}`)
  console.log(`expected inserts: ${report.summary.expectedInserts}`)
  console.log("expected updates: 0")
  console.log("expected deletes: 0")
  console.log(`writes performed: ${report.promotion.writesPerformed}`)
  console.log(`report: ${options.mode === "validate" ? validationPath : promotionPath}`)
  return report
}

export async function closeManufacturerCommandConnection() {
  await closeMongoConnection()
}
