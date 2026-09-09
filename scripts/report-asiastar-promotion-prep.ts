import assert from "node:assert/strict"
import { readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import {
  asiastarExcludedProductionDuplicates,
  asiastarPromotionModels,
  asiastarReviewedBatches,
  asiastarVariantReviewRequired,
} from "@/lib/imports/manufacturers/asiastar-review"

type SourceRecord = {
  model: string
  slug: string
  productLine: string
  source: { productUrl: string }
}

type ValidationRecord = {
  model: string
  slug: string
  status: string
  warnings: Array<{ code?: string; message: string }>
  errors: Array<{ code?: string; message: string }>
  taxonomy: { vehicleFamily: string; bodyType: string; dutyClass?: string; propulsion: string } | null
  typeResolution: { resolved: boolean; name?: string; slug?: string }
  source: { productUrl?: string } | null
  images: Array<{ sourceUrl: string | null; suggestedLocalPath: string | null; localAssetExists: boolean; status: string }>
  legacyCompatibility: { passed: boolean; imagesExposed: number; specifications: number; quoteSnapshotCompatible: boolean }
}

async function main() {
  const reportRoot = resolve("data/imports/reports/asiastar")
  const source = JSON.parse(await readFile(resolve("data/imports/raw/asiastar/asiastar_trucks.json"), "utf8")) as SourceRecord[]
  const validation = JSON.parse(await readFile(resolve(reportRoot, "validation.json"), "utf8")) as {
    brandResolution: unknown
    dataSafety: unknown
    records: ValidationRecord[]
  }
  const imageMigration = JSON.parse(await readFile(resolve(reportRoot, "image-migration.json"), "utf8")) as {
    duplicateContentGroups: string[][]
    records: Array<{ model: string; localPath: string; width: number; height: number; bytes: number; sha256: string }>
  }
  assert.equal(source.length, 31)
  assert.equal(validation.records.length, 31)
  assert.equal(imageMigration.records.length, 28)

  const excluded = new Set<string>(asiastarExcludedProductionDuplicates)
  const variantReview = new Set<string>(asiastarVariantReviewRequired)
  const promoted = new Set<string>(asiastarPromotionModels)
  const inventory = source.map((record) => {
    const result = validation.records.find((entry) => entry.model === record.model)
    assert.ok(result, `Missing validation result for ${record.model}.`)
    const migrated = imageMigration.records.find((entry) => entry.model === record.model)
    const validationStatus = excluded.has(record.model)
      ? "EXCLUDED_DUPLICATE"
      : variantReview.has(record.model)
        ? "VARIANT_REVIEW_REQUIRED"
        : result.errors.length
          ? "ERROR"
          : result.warnings.length ? "WARNING" : "PASS"
    return {
      model: record.model,
      sourceFamily: record.productLine,
      slug: record.slug,
      vehicleFamily: result.taxonomy?.vehicleFamily || null,
      bodyType: result.taxonomy?.bodyType || null,
      dutyClass: result.taxonomy?.dutyClass || null,
      propulsion: result.taxonomy?.propulsion || null,
      legacyType: result.typeResolution.resolved ? result.typeResolution.name : null,
      sourceUrl: result.source?.productUrl || record.source.productUrl,
      imageStatus: migrated ? "LOCAL_ASSET_READY" : result.images[0]?.status || "UNRESOLVED",
      localPath: migrated?.localPath || null,
      validationStatus,
      warnings: result.warnings,
      errors: result.errors,
      collisionStatus: excluded.has(record.model)
        ? "EXACT_PRODUCTION_IDENTITY_EXCLUDED"
        : variantReview.has(record.model)
          ? "AMBIGUOUS_BASE_MODEL_VARIANT_BLOCKED"
          : record.model === "YBL6121H"
            ? "REPEATED_SOURCE_LISTING_CONSOLIDATED_ONCE"
            : "NONE",
      promotionBatch: Object.entries(asiastarReviewedBatches).find(([, models]) => (models as readonly string[]).includes(record.model))?.[0] || null,
      frontendCompatible: promoted.has(record.model) ? result.legacyCompatibility.passed && result.legacyCompatibility.imagesExposed > 0 && result.legacyCompatibility.quoteSnapshotCompatible : null,
    }
  })

  const output = {
    manufacturer: "asiastar",
    generatedAt: new Date().toISOString(),
    sourceCount: source.length,
    groupedCounts: Object.fromEntries(["Coach", "Intercity Bus", "City Bus"].map((family) => [family, source.filter((record) => record.productLine === family).length])),
    brandResolution: validation.brandResolution,
    dispositionCounts: {
      promotionCandidates: inventory.filter((record) => record.promotionBatch).length,
      excludedDuplicates: inventory.filter((record) => record.validationStatus === "EXCLUDED_DUPLICATE").length,
      variantReviewRequired: inventory.filter((record) => record.validationStatus === "VARIANT_REVIEW_REQUIRED").length,
      alreadyExists: inventory.filter((record) => record.validationStatus === "ALREADY_EXISTS").length,
    },
    collisionReview: [
      {
        models: ["YBL6119H"],
        disposition: "EXCLUDED_DUPLICATE",
        reason: "The source identity matches the existing production ASIASTAR YBL6119H Passenger Bus; promotion must not overwrite or duplicate it.",
      },
      {
        models: ["YBL6128H (X9-3)", "YBL6128H"],
        disposition: "VARIANT_REVIEW_REQUIRED",
        reason: "Distinct official pages and images use the same base model and currently carry materially identical dimensions, engine, speed and seating. Evidence is insufficient to promote both as unique identities.",
      },
      {
        models: ["YBL6121H"],
        disposition: "PASS_SINGLE_RECORD",
        reason: "The manufacturer listing repeats the model, but the prepared source contains one identity and one canonical product URL, so it is retained once.",
      },
      {
        models: ["JS6128GH / JS6128GHP", "JS6108GHA / JS6108GHP", "JS6851GH / JS6851GHP", "JS6600G / JS6600GP"],
        disposition: "PASS_COMBINED_SOURCE_VARIANTS",
        reason: "Each suffix set is presented together on one official product page with one specification set and remains one source-backed record; suffixes were not rewritten or split.",
      },
    ],
    batches: Object.entries(asiastarReviewedBatches).map(([batchId, models]) => ({ batchId, models, recordCount: models.length })),
    inventory,
    imageMigration: imageMigration.records,
    duplicateImageContent: imageMigration.duplicateContentGroups,
    dataSafety: validation.dataSafety,
  }
  await writeFile(resolve(reportRoot, "promotion-readiness.json"), `${JSON.stringify(output, null, 2)}\n`, "utf8")
  console.log(`ASIASTAR promotion-prep report: ${inventory.length} inventoried, ${output.dispositionCounts.promotionCandidates} candidates, 1 excluded duplicate, 2 variant-review records.`)
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown ASIASTAR promotion-prep reporting failure.")
  process.exitCode = 1
})
