import { BSON, ObjectId, type Db } from "mongodb"
import { createLegacySelectedTruckSnapshot, vehicleToLegacyTruck } from "@/lib/data/truck-compatibility"
import { getVehicleDocumentsCollection } from "@/lib/db/vehicles"
import type { Vehicle, VehicleNormalizationDecision } from "@/lib/domain/vehicle"
import type { ManufacturerImportIssue } from "@/lib/imports/core/types"
import type { StagedVehicleImport } from "@/lib/imports/normalize-vehicle"
import { canonicalVehicleSchema, mongoVehicleDocumentSchema, vehicleInsertDocumentSchema } from "@/lib/validation/vehicle"

export type PromotionBatchDefinition = {
  batch: string
  manufacturer: string
  allowedModels: readonly string[]
  expectedCurrentTruckCount?: number
  importVersion: number
}

export type PromotionReferences = {
  brandId?: ObjectId
  brandName?: string
  brandSlug: string
  typeId?: ObjectId
  typeName?: string
  typeSlug: string
}

export type PromotionCandidate = {
  raw: unknown
  model: string
  slug: string
  staged: StagedVehicleImport
  sourceIssues: ManufacturerImportIssue[]
  sourceDecisions: VehicleNormalizationDecision[]
  resolvedType?: { id: ObjectId; name: string; slug: string }
}

export type ExistingVehicleIdentity = {
  slug: string
  model?: string
  brandId: ObjectId
  sourceProductUrl?: string
}

type PromotionIssue = ManufacturerImportIssue

function promotionIssue(
  severity: "warning" | "error",
  field: string,
  message: string,
  code: string,
  sourceValue?: unknown,
  normalizedValue?: unknown,
): PromotionIssue {
  return { severity, field, message, reason: message, code, sourceValue, normalizedValue }
}

function sourceDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value)
}

function comparableModel(value: string | undefined) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, "") || ""
}

function promotionDecisions(candidate: PromotionCandidate): VehicleNormalizationDecision[] {
  return [
    ...candidate.sourceDecisions,
    ...candidate.staged.normalizationDecisions,
    {
      field: "active",
      rawValue: false,
      normalizedValue: true,
      reason: "The reviewed staging candidate is activated only inside the explicit promotion document.",
    },
  ]
}

function buildCanonicalPreview(
  candidate: PromotionCandidate,
  references: Required<PromotionReferences>,
  definition: PromotionBatchDefinition,
  timestamp: Date,
  issues: PromotionIssue[],
): Vehicle | undefined {
  const normalized = candidate.staged.normalized
  if (!normalized) return undefined
  const importedAt = timestamp.toISOString()
  const verifiedAt = normalized.source?.verifiedAt instanceof Date
    ? normalized.source.verifiedAt.toISOString()
    : normalized.source?.verifiedAt

  return {
    slug: normalized.slug,
    brand: { id: references.brandId.toHexString(), slug: references.brandSlug, name: references.brandName },
    type: { id: references.typeId.toHexString(), slug: references.typeSlug, name: references.typeName },
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
      ? { ...normalized.source, verifiedAt: verifiedAt || importedAt }
      : undefined,
    importMetadata: {
      source: "manufacturer-import",
      manufacturer: references.brandName,
      batch: definition.batch,
      importedAt,
      verifiedAt: verifiedAt || importedAt,
      importVersion: definition.importVersion,
    },
    normalization: {
      decisions: promotionDecisions(candidate),
      warnings: issues.map(({ severity, field, message, code }) => ({ severity, field, message, code })),
    },
    seo: normalized.seo,
    featured: normalized.featured,
    active: true,
    displayOrder: normalized.displayOrder,
    createdAt: importedAt,
    updatedAt: importedAt,
  }
}

export function createInsertOnlyPromotionPlan(args: {
  definition: PromotionBatchDefinition
  requestedManufacturer: string
  requestedModels: readonly string[]
  candidates: PromotionCandidate[]
  references: PromotionReferences
  existingVehicles: ExistingVehicleIdentity[]
  currentTruckCount: number
  startingDisplayOrder: number
  uniqueSlugIndex: boolean
  timestamp: Date
}) {
  const batchErrors: PromotionIssue[] = []
  if (args.requestedManufacturer.trim().toLowerCase() !== args.definition.manufacturer.trim().toLowerCase()) {
    batchErrors.push(promotionIssue("error", "manufacturer", "Manufacturer is not approved for this promotion batch.", "UNKNOWN_MANUFACTURER", args.requestedManufacturer, args.definition.manufacturer))
  }
  const allowed = new Set(args.definition.allowedModels)
  const requested = new Set(args.requestedModels)
  const unknownModels = [...requested].filter((model) => !allowed.has(model))
  if (unknownModels.length) {
    batchErrors.push(promotionIssue("error", "models", "Promotion request contains non-whitelisted models.", "UNKNOWN_MODEL", unknownModels, args.definition.allowedModels))
  }
  if (args.definition.expectedCurrentTruckCount !== undefined && args.currentTruckCount !== args.definition.expectedCurrentTruckCount) {
    batchErrors.push(promotionIssue("error", "currentTruckCount", "Production truck count differs from the reviewed batch baseline.", "UNEXPECTED_TRUCK_COUNT", args.currentTruckCount, args.definition.expectedCurrentTruckCount))
  }
  if (!args.uniqueSlugIndex) {
    batchErrors.push(promotionIssue("error", "slug", "The production trucks collection lacks a unique slug index.", "MISSING_UNIQUE_SLUG_INDEX"))
  }

  if (!args.references.brandId || !args.references.brandName) {
    batchErrors.push(promotionIssue("error", "brandSlug", "The approved manufacturer brand could not be resolved.", "UNRESOLVED_BRAND", args.references.brandSlug, null))
  }
  const records = args.candidates.map((candidate, index) => {
    const issues: PromotionIssue[] = [
      ...candidate.sourceIssues,
      ...candidate.staged.issues.map((entry) => ({ ...entry, reason: entry.message })),
    ]
    if (!allowed.has(candidate.model)) {
      issues.push(promotionIssue("error", "model", "Model is outside the approved batch whitelist.", "UNKNOWN_MODEL", candidate.model, null))
    }
    if (args.candidates.filter((entry) => entry.slug.toLowerCase() === candidate.slug.toLowerCase()).length > 1) {
      issues.push(promotionIssue("error", "slug", "The promotion batch contains a duplicate slug.", "BATCH_SLUG_COLLISION", candidate.slug, null))
    }
    if (args.candidates.filter((entry) => entry.model.trim().toLowerCase() === candidate.model.trim().toLowerCase()).length > 1) {
      issues.push(promotionIssue("error", "model", "The promotion batch contains a duplicate manufacturer/model identity.", "BATCH_MODEL_COLLISION", candidate.model, null))
    }
    if (args.candidates.filter((entry) => comparableModel(entry.model) === comparableModel(candidate.model)).length > 1
      && !issues.some((entry) => entry.code === "BATCH_MODEL_COLLISION")) {
      issues.push(promotionIssue("error", "model", "The promotion batch contains likely equivalent model identities.", "BATCH_LIKELY_EQUIVALENT_MODEL", candidate.model, null))
    }
    const slugCollision = args.existingVehicles.find((vehicle) => vehicle.slug.toLowerCase() === candidate.slug.toLowerCase())
    const modelCollision = args.references.brandId
      ? args.existingVehicles.find((vehicle) => (
          vehicle.brandId.equals(args.references.brandId) && vehicle.model?.trim().toLowerCase() === candidate.model.trim().toLowerCase()
        ))
      : undefined
    const productUrl = candidate.staged.normalized?.source?.productUrl
    const sourceCollision = productUrl
      ? args.existingVehicles.find((vehicle) => vehicle.sourceProductUrl === productUrl && (
          !args.references.brandId || vehicle.brandId.equals(args.references.brandId)
        ))
      : undefined
    const likelyModelCollision = !modelCollision && args.references.brandId
      ? args.existingVehicles.find((vehicle) => (
          vehicle.brandId.equals(args.references.brandId) && comparableModel(vehicle.model) === comparableModel(candidate.model)
        ))
      : undefined
    const exactSlugMatch = Boolean(slugCollision && args.references.brandId && slugCollision.brandId.equals(args.references.brandId)
      && slugCollision.model?.trim().toLowerCase() === candidate.model.trim().toLowerCase())
    const alreadyExists = exactSlugMatch || (!slugCollision && Boolean(modelCollision))
    if (alreadyExists) {
      issues.push(promotionIssue("warning", "identity", "An equivalent manufacturer vehicle is already promoted; no write will be attempted.", "ALREADY_EXISTS", candidate.slug, slugCollision?.slug || modelCollision?.slug || sourceCollision?.slug))
    } else {
      if (slugCollision) {
        issues.push(promotionIssue("error", "slug", "Production contains this slug with a different identity; insert-safe promotion cannot overwrite it.", "PRODUCTION_SLUG_COLLISION", candidate.slug, slugCollision.slug))
      }
      if (modelCollision) {
        issues.push(promotionIssue("error", "model", "Production contains this brand/model under a conflicting identity; silent updates are forbidden.", "PRODUCTION_MODEL_COLLISION", candidate.model, modelCollision.model))
      }
      if (likelyModelCollision) {
        issues.push(promotionIssue("error", "model", "Production contains a likely equivalent brand/model; manual review is required and no write is allowed.", "PRODUCTION_LIKELY_EQUIVALENT_MODEL", candidate.model, likelyModelCollision.model))
      }
      if (sourceCollision) {
        issues.push(promotionIssue("warning", "source.productUrl", "Another production vehicle uses this official product URL; review likely equivalence.", "PRODUCTION_SOURCE_URL_COLLISION", productUrl, sourceCollision.slug))
      }
    }

    const candidateReferences: PromotionReferences = candidate.resolvedType
      ? {
          ...args.references,
          typeId: candidate.resolvedType.id,
          typeName: candidate.resolvedType.name,
          typeSlug: candidate.resolvedType.slug,
        }
      : args.references
    const referencesResolved = Boolean(
      candidateReferences.brandId && candidateReferences.brandName && candidateReferences.typeId && candidateReferences.typeName,
    )
    if (!candidateReferences.typeId || !candidateReferences.typeName) {
      issues.push(promotionIssue("error", "typeSlug", "The legacy compatibility truck type could not be resolved.", "UNRESOLVED_TYPE", candidateReferences.typeSlug, null))
    }
    const completeReferences = referencesResolved ? candidateReferences as Required<PromotionReferences> : undefined

    let canonicalPreview: Vehicle | undefined
    let document: ReturnType<typeof vehicleInsertDocumentSchema.parse> | undefined
    let legacyCompatibility = { passed: false, imagesExposed: 0, specifications: 0, quoteSnapshotCompatible: false }
    if (completeReferences && candidate.staged.normalized) {
      canonicalPreview = buildCanonicalPreview(candidate, completeReferences, args.definition, args.timestamp, issues)
      if (canonicalPreview) {
        canonicalPreview.displayOrder = args.startingDisplayOrder + index + 1
        const canonicalResult = canonicalVehicleSchema.safeParse(canonicalPreview)
        if (!canonicalResult.success) {
          for (const validationIssue of canonicalResult.error.issues) {
            issues.push(promotionIssue("error", validationIssue.path.join(".") || "vehicle", validationIssue.message, "CANONICAL_VALIDATION"))
          }
        } else {
          try {
            const legacy = vehicleToLegacyTruck(canonicalPreview)
            const hypotheticalId = new ObjectId().toHexString()
            const snapshot = createLegacySelectedTruckSnapshot({ ...canonicalPreview, _id: hypotheticalId })
            legacyCompatibility = {
              passed: true,
              imagesExposed: legacy.images.length,
              specifications: legacy.specifications.length,
              quoteSnapshotCompatible: Boolean(snapshot.truckId && !("vehicleId" in snapshot)),
            }
          } catch (error) {
            issues.push(promotionIssue("error", "legacyAdapter", error instanceof Error ? error.message : "Legacy adapter failed.", "LEGACY_ADAPTER_FAILURE"))
          }

          const normalized = candidate.staged.normalized
          const verifiedAt = normalized.source?.verifiedAt
            ? sourceDate(normalized.source.verifiedAt)
            : args.timestamp
          const insertResult = vehicleInsertDocumentSchema.safeParse({
            slug: normalized.slug,
            brandId: completeReferences.brandId,
            typeId: completeReferences.typeId,
            name: normalized.name,
            model: normalized.model,
            class: normalized.dutyClass,
            vehicleFamily: normalized.vehicleFamily,
            bodyType: normalized.bodyType,
            dutyClass: normalized.dutyClass,
            propulsion: normalized.propulsion,
            applicationTags: normalized.applicationTags,
            shortDescription: normalized.shortDescription,
            description: normalized.description,
            featured: normalized.featured,
            active: true,
            images: normalized.images,
            keySpecs: normalized.keySpecs,
            specificationGroups: normalized.specificationGroups,
            applications: normalized.applications,
            configurations: normalized.configurations,
            brochure: normalized.brochure,
            brochureUrl: normalized.brochureUrl,
            source: normalized.source ? { ...normalized.source, verifiedAt } : undefined,
            importMetadata: {
              source: "manufacturer-import",
              manufacturer: completeReferences.brandName,
              batch: args.definition.batch,
              importedAt: args.timestamp,
              verifiedAt,
              importVersion: args.definition.importVersion,
            },
            normalization: {
              decisions: promotionDecisions(candidate),
              warnings: issues.map(({ severity, field, message, code }) => ({ severity, field, message, code })),
            },
            seo: normalized.seo,
            displayOrder: args.startingDisplayOrder + index + 1,
            createdAt: args.timestamp,
            updatedAt: args.timestamp,
          })
          if (!insertResult.success) {
            for (const validationIssue of insertResult.error.issues) {
              issues.push(promotionIssue("error", validationIssue.path.join(".") || "document", validationIssue.message, "INSERT_DOCUMENT_VALIDATION"))
            }
          } else {
            const bsonRoundTrip = vehicleInsertDocumentSchema.safeParse(BSON.deserialize(
              BSON.serialize(insertResult.data, { ignoreUndefined: true }),
            ))
            if (!bsonRoundTrip.success) {
              for (const validationIssue of bsonRoundTrip.error.issues) {
                issues.push(promotionIssue("error", validationIssue.path.join(".") || "document", validationIssue.message, "BSON_DOCUMENT_VALIDATION"))
              }
            } else {
              document = bsonRoundTrip.data
            }
          }
        }
      }
    }

    const errors = issues.filter((entry) => entry.severity === "error")
    const warnings = issues.filter((entry) => entry.severity === "warning")
    return {
      model: candidate.model,
      slug: candidate.slug,
      promotionStatus: errors.length ? "blocked" as const : alreadyExists ? "already-exists" as const : "eligible" as const,
      warnings,
      errors,
      canonicalPreview,
      document,
      legacyCompatibility,
      imageStatus: canonicalPreview?.images.map((image) => ({
        validatedUrl: image.url,
        storageProvider: image.storageProvider,
        currentFrontendBehavior: legacyCompatibility.imagesExposed === 0
          ? "provenance-only; frontend shows photography unavailable until local migration"
          : "renderable",
      })) || [],
    }
  })

  const eligible = records.filter((record) => record.promotionStatus === "eligible").length
  const alreadyExists = records.filter((record) => record.promotionStatus === "already-exists").length
  const blocked = records.filter((record) => record.promotionStatus === "blocked").length
  const applyAllowed = batchErrors.length === 0 && blocked === 0 && eligible > 0
  return {
    batch: args.definition.batch,
    manufacturer: args.definition.manufacturer,
    mode: "dry-run" as const,
    eligible,
    alreadyExists,
    blocked,
    currentTruckCount: args.currentTruckCount,
    expectedTruckCountAfterApply: args.currentTruckCount + eligible,
    applyAllowed,
    batchErrors,
    references: {
      brand: args.references.brandName || null,
      brandId: args.references.brandId?.toHexString() || null,
      brandSlug: args.references.brandSlug,
      legacyType: args.references.typeName || null,
      typeId: args.references.typeId?.toHexString() || null,
      typeSlug: args.references.typeSlug,
      canonicalBodyType: "Rigid Truck",
    },
    uniqueSlugIndex: args.uniqueSlugIndex,
    transactionPolicy: "Every eligible record inserts in one MongoDB transaction; any conflict or validation failure aborts the entire insert batch. Existing records are never updated.",
    records,
  }
}

export async function applyPromotionPlan(
  db: Db,
  plan: ReturnType<typeof createInsertOnlyPromotionPlan>,
) {
  if (!plan.applyAllowed || plan.blocked || plan.eligible < 1) {
    throw new Error("Promotion plan is not eligible for atomic apply.")
  }
  const documents = plan.records.filter((record) => record.promotionStatus === "eligible").map((record) => {
    if (!record.document) throw new Error(`Promotion document is unavailable for ${record.model}.`)
    return record.document
  })
  const slugs = documents.map((document) => document.slug)
  const models = documents.flatMap((document) => document.model ? [document.model] : [])
  const brandId = documents[0]?.brandId
  const collection = getVehicleDocumentsCollection(db)
  const session = db.client.startSession()
  let insertedIds: string[] = []
  try {
    await session.withTransaction(async () => {
      const currentCount = await collection.countDocuments({}, { session })
      if (currentCount !== plan.currentTruckCount) throw new Error("Production truck count changed after dry-run planning.")
      const collisions = await collection.countDocuments({
        $or: [
          { slug: { $in: slugs } },
          ...(brandId ? [{ brandId, model: { $in: models } }] : []),
        ],
      }, { session, collation: { locale: "en", strength: 2 } })
      if (collisions) throw new Error("A promotion identity appeared after planning; transaction aborted.")
      const result = await collection.insertMany(documents, { ordered: true, session, ignoreUndefined: true })
      if (result.insertedCount !== documents.length) throw new Error("MongoDB did not acknowledge all promotion inserts.")
      const expectedCount = plan.currentTruckCount + documents.length
      const resultingCount = await collection.countDocuments({}, { session })
      if (resultingCount !== expectedCount) throw new Error("Unexpected truck count inside promotion transaction.")
      const inserted = await collection.find({ slug: { $in: slugs } }, { session }).toArray()
      if (inserted.length !== documents.length) throw new Error("Promotion read-back did not return all inserted documents.")
      for (const document of inserted) mongoVehicleDocumentSchema.parse(document)
      insertedIds = Object.values(result.insertedIds).map((id) => id.toHexString())
    }, {
      readConcern: { level: "snapshot" },
      writeConcern: { w: "majority" },
    })
  } finally {
    await session.endSession()
  }
  return insertedIds
}
