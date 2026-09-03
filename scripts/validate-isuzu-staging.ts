import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import type { Db, ObjectId } from "mongodb"
import { getTrucks } from "@/lib/data/trucks"
import { vehicleToLegacyTruck } from "@/lib/data/truck-compatibility"
import {
  isuzuBrandSourceSchema,
  isuzuTestModels,
  isuzuTruckSourceSchema,
  normalizeIsuzuSourceRecord,
  type ManufacturerImportIssue,
} from "@/lib/imports/isuzu"
import { stageVehicleImports } from "@/lib/imports/normalize-vehicle"
import {
  getBrandsCollection,
  getInquiriesCollection,
  getQuoteRequestsCollection,
  getTrucksCollection,
} from "@/lib/db/collections"
import { resolveBrandIdsBySlug } from "@/lib/db/vehicles"
import { closeMongoConnection, getMongoDatabase } from "@/lib/db/mongodb"
import type { Vehicle } from "@/lib/domain/vehicle"
import { loadLocalEnvironment } from "@/scripts/seed-helpers"
import { canonicalVehicleSchema } from "@/lib/validation/vehicle"

const brandSourcePath = resolve("data/imports/raw/isuzu/isuzu_brands.json")
const truckSourcePath = resolve("data/imports/raw/isuzu/isuzu_trucks.json")
const reportPath = resolve("data/imports/reports/isuzu-n-series-test.json")

type DatabaseSnapshot = {
  trucks: number
  brands: number
  inquiries: number
  quoteRequests: number
}

type ExistingTruckIdentity = {
  slug: string
  model?: string
  brandId: ObjectId
}

function issue(
  severity: "warning" | "error",
  field: string,
  reason: string,
  code: string,
  sourceValue?: unknown,
  normalizedValue?: unknown,
): ManufacturerImportIssue {
  return { severity, field, message: reason, reason, code, sourceValue, normalizedValue }
}

async function readJson(path: string) {
  return JSON.parse(await readFile(path, "utf8")) as unknown
}

async function databaseSnapshot(db: Db): Promise<DatabaseSnapshot> {
  const [trucks, brands, inquiries, quoteRequests] = await Promise.all([
    getTrucksCollection(db).countDocuments({}),
    getBrandsCollection(db).countDocuments({}),
    getInquiriesCollection(db).countDocuments({}),
    getQuoteRequestsCollection(db).countDocuments({}),
  ])
  return { trucks, brands, inquiries, quoteRequests }
}

async function resolveCatalogDatabase(initialDatabase: Db) {
  const initialSnapshot = await databaseSnapshot(initialDatabase)
  if (initialSnapshot.brands || initialSnapshot.trucks) return initialDatabase

  const databaseList = await initialDatabase.admin().listDatabases({ nameOnly: true })
  const candidates: Db[] = []
  for (const { name } of databaseList.databases) {
    if (["admin", "config", "local"].includes(name)) continue
    const candidate = initialDatabase.client.db(name)
    const [brands, trucks] = await Promise.all([
      getBrandsCollection(candidate).countDocuments({}),
      getTrucksCollection(candidate).countDocuments({}),
    ])
    if (brands > 0 && trucks > 0) candidates.push(candidate)
  }
  if (candidates.length !== 1) {
    throw new Error(`Unable to identify one production catalog database from the accessible databases (matches: ${candidates.length}). Set MONGODB_DB locally to the protected Vercel value.`)
  }
  return candidates[0]
}

function valuesEqual(first: DatabaseSnapshot, second: DatabaseSnapshot) {
  return Object.keys(first).every((key) => first[key as keyof DatabaseSnapshot] === second[key as keyof DatabaseSnapshot])
}

function reportIssue(rawIssue: ManufacturerImportIssue) {
  return {
    severity: rawIssue.severity,
    field: rawIssue.field,
    sourceValue: rawIssue.sourceValue,
    normalizedValue: rawIssue.normalizedValue,
    reason: rawIssue.reason || rawIssue.message,
    code: rawIssue.code,
  }
}

function buildVehicle(
  normalized: NonNullable<ReturnType<typeof stageVehicleImports>["records"][number]["normalized"]>,
  brandId: ObjectId | undefined,
  brandName: string,
  decisions: ReturnType<typeof normalizeIsuzuSourceRecord>["decisions"],
  warnings: ManufacturerImportIssue[],
  timestamp: string,
): Vehicle {
  return {
    slug: normalized.slug,
    brand: { ...(brandId ? { id: brandId.toHexString() } : {}), slug: normalized.brandSlug, name: brandName },
    name: normalized.name,
    model: normalized.model,
    vehicleFamily: normalized.vehicleFamily,
    bodyType: normalized.bodyType,
    dutyClass: normalized.dutyClass,
    propulsion: normalized.propulsion,
    applicationTags: normalized.applicationTags,
    shortDescription: normalized.shortDescription,
    description: normalized.description,
    images: normalized.images,
    keySpecs: normalized.keySpecs,
    specificationGroups: normalized.specificationGroups,
    applications: normalized.applications,
    configurations: normalized.configurations,
    brochure: normalized.brochure,
    brochureUrl: normalized.brochureUrl,
    source: normalized.source
      ? {
          ...normalized.source,
          verifiedAt: normalized.source.verifiedAt instanceof Date
            ? normalized.source.verifiedAt.toISOString()
            : normalized.source.verifiedAt,
        }
      : undefined,
    normalization: {
      decisions,
      warnings: warnings.map(({ severity, field, message, code }) => ({ severity, field, message, code })),
    },
    seo: normalized.seo,
    featured: normalized.featured,
    active: normalized.active,
    displayOrder: normalized.displayOrder,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
}

async function main() {
  loadLocalEnvironment()
  if (process.env.MONGODB_DB === "[SENSITIVE]") delete process.env.MONGODB_DB
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI === "[SENSITIVE]") {
    throw new Error("A local read-only MONGODB_URI is required to resolve the production brand and verify before/after counts.")
  }

  const rawBrands = await readJson(brandSourcePath)
  const rawTrucks = await readJson(truckSourcePath)
  const sourceBrands = isuzuBrandSourceSchema.array().parse(rawBrands)
  const sourceTrucks = isuzuTruckSourceSchema.array().parse(rawTrucks)
  assert.equal(sourceBrands.length, 1, "Expected one Isuzu source brand record.")
  assert.equal(sourceTrucks.length, 26, "Expected 26 Isuzu source truck records.")

  const requestedModels = new Set<string>(isuzuTestModels)
  const selectedRecords = sourceTrucks.filter((record) => requestedModels.has(record.model))
  assert.equal(selectedRecords.length, isuzuTestModels.length, "The selected Isuzu test batch is incomplete.")
  assert.deepEqual(new Set(selectedRecords.map((record) => record.model)), requestedModels, "The selected model set differs from the requested batch.")

  const db = await resolveCatalogDatabase(await getMongoDatabase())
  const before = await databaseSnapshot(db)
  const brandIds = await resolveBrandIdsBySlug(db, ["isuzu"])
  const brandId = brandIds.get("isuzu")
  const availableBrands = await getBrandsCollection(db)
    .find({}, { projection: { name: 1, slug: 1 } })
    .toArray()
  const brandDocument = brandId
    ? await getBrandsCollection(db).findOne({ _id: brandId }, { projection: { name: 1, slug: 1 } })
    : null

  const existingTrucks = await getTrucksCollection(db)
    .find({}, { projection: { slug: 1, model: 1, brandId: 1 } })
    .toArray() as ExistingTruckIdentity[]
  const sourceBrand = sourceBrands.find((brand) => brand.slug.toLowerCase() === "isuzu")
  assert.ok(sourceBrand, "The Isuzu source brand record is unavailable.")

  const normalizedSources = selectedRecords.map((record) => normalizeIsuzuSourceRecord(record, sourceBrand))
  const staged = stageVehicleImports(normalizedSources.map((record) => record.input), {
    knownBrandSlugs: brandDocument ? [brandDocument.slug] : [],
  })
  const timestamp = new Date().toISOString()

  const records = selectedRecords.map((raw, index) => {
    const sourceNormalization = normalizedSources[index]
    const stagingRecord = staged.records[index]
    const issues: ManufacturerImportIssue[] = [
      ...sourceNormalization.issues,
      ...stagingRecord.issues.map((stagingIssue) => ({
        ...stagingIssue,
        reason: stagingIssue.message,
        ...(stagingIssue.code === "UNKNOWN_BRAND" ? { sourceValue: raw.brandSlug, normalizedValue: null } : {}),
      })),
    ]

    const productionSlug = existingTrucks.find((truck) => truck.slug.toLowerCase() === raw.slug.toLowerCase())
    if (productionSlug) {
      issues.push(issue("error", "slug", "Slug already exists in the production trucks collection; automatic overwrite is forbidden.", "PRODUCTION_SLUG_COLLISION", raw.slug, productionSlug.slug))
    }
    const productionModel = brandId
      ? existingTrucks.find((truck) => (
          truck.brandId.equals(brandId) && truck.model?.trim().toLowerCase() === raw.model.trim().toLowerCase()
        ))
      : undefined
    if (productionModel) {
      issues.push(issue("warning", "model", "An equivalent ISUZU model already exists in production and requires manual comparison.", "PRODUCTION_MODEL_COLLISION", raw.model, productionModel.model))
    }

    const otherSourceMatches = sourceTrucks.filter((candidate) => (
      candidate !== raw && (
        candidate.slug.toLowerCase() === raw.slug.toLowerCase() ||
        (candidate.brandSlug.toLowerCase() === raw.brandSlug.toLowerCase() && candidate.model.toLowerCase() === raw.model.toLowerCase())
      )
    ))
    if (otherSourceMatches.length) {
      issues.push(issue("warning", "model", "A matching slug or brand/model also exists elsewhere in the source catalog.", "SOURCE_MODEL_COLLISION", raw.model, otherSourceMatches.map((record) => record.model)))
    }

    let canonicalVehicle: Vehicle | undefined
    let legacyAdapter = { passed: false, specificationCount: 0 }
    if (stagingRecord.normalized) {
      canonicalVehicle = buildVehicle(
        stagingRecord.normalized,
        brandId,
        brandDocument?.name || sourceBrand.name,
        [...sourceNormalization.decisions, ...stagingRecord.normalizationDecisions],
        issues,
        timestamp,
      )
      const canonicalValidation = canonicalVehicleSchema.safeParse(canonicalVehicle)
      if (!canonicalValidation.success) {
        for (const validationIssue of canonicalValidation.error.issues) {
          issues.push(issue("error", validationIssue.path.join(".") || "vehicle", validationIssue.message, "CANONICAL_VEHICLE_VALIDATION"))
        }
      } else {
        try {
          const legacyTruck = vehicleToLegacyTruck(canonicalVehicle)
          legacyAdapter = { passed: true, specificationCount: legacyTruck.specifications.length }
        } catch (error) {
          issues.push(issue("error", "legacyAdapter", error instanceof Error ? error.message : "Legacy adapter failed.", "LEGACY_ADAPTER_FAILURE"))
        }
      }
    }

    const status = issues.some((entry) => entry.severity === "error")
      ? "ERROR"
      : issues.some((entry) => entry.severity === "warning")
        ? "WARNING"
        : "PASS"

    return {
      model: raw.model,
      status,
      rawSource: raw,
      normalizationDecisions: sourceNormalization.decisions,
      issues: issues.map(reportIssue),
      canonicalVehicle,
      legacyAdapter,
      imageValidation: {
        passed: Boolean(canonicalVehicle?.images.length && canonicalVehicle.images.filter((image) => image.isPrimary).length === 1),
        imageCount: canonicalVehicle?.images.length || 0,
        externalOnly: canonicalVehicle?.images.every((image) => image.storageProvider === "external") || false,
        rehosted: false,
      },
    }
  })

  const malformed = structuredClone(normalizedSources[0].input) as Record<string, unknown>
  delete malformed.slug
  const isolation = stageVehicleImports([...normalizedSources.map((record) => record.input), malformed], {
    knownBrandSlugs: ["isuzu"],
  })
  const invalidRecordIsolation = {
    passed: isolation.records.slice(0, 8).every((record) => record.status !== "rejected") && isolation.records[8].status === "rejected",
    validRecordsRetained: isolation.records.slice(0, 8).filter((record) => record.status !== "rejected").length,
    malformedRecordsRejected: isolation.records.slice(8).filter((record) => record.status === "rejected").length,
  }
  assert.ok(invalidRecordIsolation.passed, "Malformed-record isolation failed.")

  process.env.MONGODB_DB = db.databaseName
  const publicCatalog = await getTrucks()
  const after = await databaseSnapshot(db)
  assert.ok(valuesEqual(before, after), "Production collection counts changed during read-only staging validation.")
  assert.equal(after.trucks, 12, "The production trucks collection must remain at 12 documents.")
  assert.equal(publicCatalog.length, 12, "The public catalog must continue returning the original 12 vehicles.")
  assert.equal(new Set(publicCatalog.map((truck) => truck.slug)).size, 12, "The public catalog contains duplicate slugs.")

  const report = {
    generatedAt: timestamp,
    manufacturer: sourceBrand.name,
    sourceFiles: {
      brands: { path: "data/imports/raw/isuzu/isuzu_brands.json", records: sourceBrands.length },
      trucks: { path: "data/imports/raw/isuzu/isuzu_trucks.json", records: sourceTrucks.length },
    },
    tested: records.length,
    passed: records.filter((record) => record.status !== "ERROR").length,
    warnings: records.flatMap((record) => record.issues).filter((entry) => entry.severity === "warning").length,
    errors: records.flatMap((record) => record.issues).filter((entry) => entry.severity === "error").length,
    statusCounts: {
      pass: records.filter((record) => record.status === "PASS").length,
      warning: records.filter((record) => record.status === "WARNING").length,
      error: records.filter((record) => record.status === "ERROR").length,
    },
    brandResolution: {
      brandSlug: "isuzu",
      resolved: Boolean(brandDocument && brandId),
      resolvedBrandName: brandDocument?.name || null,
      resolvedObjectId: brandId?.toHexString() || null,
      hardCoded: false,
      availableBrands: availableBrands.map((brand) => ({ name: brand.name, slug: brand.slug })),
    },
    records,
    duplicateChecks: {
      batchSlugCollisions: records.filter((record) => record.issues.some((entry) => entry.code === "DUPLICATE_SLUG")).length,
      productionSlugCollisions: records.filter((record) => record.issues.some((entry) => entry.code === "PRODUCTION_SLUG_COLLISION")).length,
      productionModelCollisions: records.filter((record) => record.issues.some((entry) => entry.code === "PRODUCTION_MODEL_COLLISION")).length,
      otherSourceModelCollisions: records.filter((record) => record.issues.some((entry) => entry.code === "SOURCE_MODEL_COLLISION")).length,
    },
    invalidRecordIsolation,
    productionDatabase: { before, after, unchanged: valuesEqual(before, after) },
    publicCatalog: { count: publicCatalog.length, uniqueSlugs: new Set(publicCatalog.map((truck) => truck.slug)).size },
    promotionPerformed: false,
    recommendation: records.some((record) => record.status === "ERROR")
      ? "NEEDS DATA CORRECTIONS"
      : "READY FOR PROMOTION DESIGN",
  }

  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
  console.log(`ISUZU staging validation: ${report.passed} eligible, ${report.warnings} WARNING, ${report.errors} ERROR`)
  console.log(brandDocument && brandId
    ? `Brand resolution: isuzu -> ${brandDocument.name} -> ${brandId.toHexString()}`
    : "Brand resolution: isuzu -> UNRESOLVED (no production brand document)")
  console.log(`Production counts unchanged: ${JSON.stringify(after)}`)
  console.log(`QA report: ${reportPath}`)
}

main()
  .catch((error: unknown) => {
    const rawMessage = error instanceof Error ? error.message : "Unknown Isuzu staging validation failure."
    const uri = process.env.MONGODB_URI
    console.error(uri ? rawMessage.replaceAll(uri, "[redacted]") : rawMessage)
    process.exitCode = 1
  })
  .finally(closeMongoConnection)
