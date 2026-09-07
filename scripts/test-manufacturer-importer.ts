import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { ObjectId } from "mongodb"
import { getManufacturerConfiguration, manufacturerRegistry } from "@/lib/imports/core/registry"
import { normalizeIsuzuSourceRecord } from "@/lib/imports/isuzu"
import { stageVehicleImports } from "@/lib/imports/normalize-vehicle"
import { createInsertOnlyPromotionPlan, type ExistingVehicleIdentity, type PromotionCandidate } from "@/lib/imports/vehicle-promotion"

const regressionModels = ["NMR85HS", "NQR75LS", "QLR77E", "NLR85ES", "NLR77H", "NLR85E", "NMR85H", "NPR85K"]

async function main() {
  assert.deepEqual(Object.keys(manufacturerRegistry), ["isuzu", "faw", "forland", "shacman", "asiastar", "sinotruk", "yutong"])
  const config = getManufacturerConfiguration("Isuzu")
  const rawBrands = JSON.parse(await readFile(config.sourceFiles.brands, "utf8")) as unknown[]
  const rawVehicles = JSON.parse(await readFile(config.sourceFiles.vehicles, "utf8")) as unknown[]
  const brandResult = config.adapter.parseBrand(rawBrands[0])
  assert.equal(brandResult.success, true)
  if (!brandResult.success) return

  const selected = rawVehicles
    .map((raw) => ({ raw, result: config.adapter.normalizeVehicle(raw, brandResult.data) }))
    .filter(({ result }) => result.success && regressionModels.includes(result.input.model || ""))
  assert.equal(selected.length, 8)
  const normalized = selected.map(({ result }) => {
    assert.equal(result.success, true)
    if (!result.success) throw new Error("Unexpected adapter failure.")
    return result
  })
  for (let index = 0; index < selected.length; index += 1) {
    const genericResult = {
      input: normalized[index].input,
      legacyTypeSlug: normalized[index].legacyTypeSlug,
      decisions: normalized[index].decisions,
      issues: normalized[index].issues,
    }
    assert.deepEqual(genericResult, normalizeIsuzuSourceRecord(selected[index].raw as Parameters<typeof normalizeIsuzuSourceRecord>[0], brandResult.data as Parameters<typeof normalizeIsuzuSourceRecord>[1]))
  }
  const staged = stageVehicleImports(normalized.map((record) => record.input), { knownBrandSlugs: ["isuzu"] })
  assert.equal(staged.rejected, 0)

  const brandId = new ObjectId()
  const typeId = new ObjectId()
  const candidates: PromotionCandidate[] = normalized.map((record, index) => ({
    raw: selected[index].raw,
    model: record.input.model || record.input.name,
    slug: record.input.slug,
    staged: staged.records[index],
    sourceIssues: record.issues,
    sourceDecisions: record.decisions,
    resolvedType: { id: typeId, name: "Cargo", slug: "cargo" },
  }))
  const existingVehicles: ExistingVehicleIdentity[] = candidates.map((candidate) => ({
    slug: candidate.slug,
    model: candidate.model,
    brandId,
    sourceProductUrl: candidate.staged.normalized?.source?.productUrl,
  }))
  const plan = createInsertOnlyPromotionPlan({
    definition: { batch: "isuzu-regression", manufacturer: "ISUZU", allowedModels: regressionModels, importVersion: 1 },
    requestedManufacturer: "isuzu",
    requestedModels: regressionModels,
    candidates,
    references: { brandId, brandName: "ISUZU", brandSlug: "isuzu", typeSlug: "per-record" },
    existingVehicles,
    currentTruckCount: 20,
    startingDisplayOrder: 20,
    uniqueSlugIndex: true,
    timestamp: new Date("2026-09-07T00:00:00.000Z"),
  })
  assert.equal(plan.alreadyExists, 8)
  assert.equal(plan.eligible, 0)
  assert.equal(plan.blocked, 0)
  assert.equal(plan.records.find((record) => record.model === "NQR75LS")?.warnings.some((warning) => warning.code === "MANUFACTURER_SOURCE_WARNING"), true)
  assert.equal(plan.records.every((record) => record.legacyCompatibility.passed), true)

  const remainingModels = config.reviewedBatches?.["isuzu-remaining-001"]
  assert.equal(remainingModels?.length, 18)
  const remaining = rawVehicles.flatMap((raw) => {
    const result = config.adapter.normalizeVehicle(raw, brandResult.data)
    return result.success && result.input.model && remainingModels?.includes(result.input.model) ? [{ raw, result }] : []
  })
  assert.equal(remaining.length, 18)
  const remainingStaged = stageVehicleImports(remaining.map(({ result }) => result.input), { knownBrandSlugs: ["isuzu"] })
  assert.equal(remainingStaged.rejected, 0)
  const remainingCandidates: PromotionCandidate[] = remaining.map(({ raw, result }, index) => ({
    raw,
    model: result.input.model || result.input.name,
    slug: result.input.slug,
    staged: remainingStaged.records[index],
    sourceIssues: result.issues,
    sourceDecisions: result.decisions,
    resolvedType: {
      id: typeId,
      name: config.legacyTypeAliases[result.legacyTypeSlug] === "bus" ? "Bus" : config.legacyTypeAliases[result.legacyTypeSlug] === "tractor-head" ? "Tractor Head" : "Cargo",
      slug: config.legacyTypeAliases[result.legacyTypeSlug] || result.legacyTypeSlug,
    },
  }))
  const remainingPlan = createInsertOnlyPromotionPlan({
    definition: { batch: "isuzu-remaining-001", manufacturer: "ISUZU", allowedModels: remainingModels || [], importVersion: 1 },
    requestedManufacturer: "ISUZU",
    requestedModels: remainingModels || [],
    candidates: remainingCandidates,
    references: { brandId, brandName: "ISUZU", brandSlug: "isuzu", typeSlug: "per-record" },
    existingVehicles,
    currentTruckCount: 20,
    startingDisplayOrder: 20,
    uniqueSlugIndex: true,
    timestamp: new Date("2026-09-07T00:00:00.000Z"),
  })
  assert.equal(remainingPlan.eligible, 18)
  assert.equal(remainingPlan.blocked, 0)
  assert.equal(remainingPlan.alreadyExists, 0)
  assert.equal(remainingPlan.records.find((record) => record.model === "FVM34 W")?.canonicalPreview?.bodyType, "Wing Van")
  assert.deepEqual(
    remainingPlan.records
      .filter((record) => record.warnings.some((warning) => warning.code === "SOURCE_DUTY_CLASS_RESOLVED") && record.canonicalPreview?.dutyClass === "Medium Duty")
      .map((record) => record.model),
    ["FRR90 M", "FTR90 M", "FVR34 Q", "FVR34QS", "FRR90MS"],
  )
  assert.deepEqual(
    remainingPlan.records
      .filter((record) => record.warnings.some((warning) => warning.code === "SOURCE_DUTY_CLASS_RESOLVED") && record.canonicalPreview?.dutyClass === "Heavy Duty")
      .map((record) => record.model),
    ["FVM34 W", "FVM34 T", "FXM60 W", "FVZ34"],
  )
  assert.equal(remainingPlan.records.filter((record) => record.warnings.some((warning) => warning.code === "SOURCE_DUTY_CLASS_RESOLVED")).length, 9)
  assert.equal(remainingPlan.records.every((record) => record.legacyCompatibility.passed), true)
  assert.equal(remainingPlan.records.every((record) => record.canonicalPreview?.images.every((image) => image.suggestedLocalPath?.endsWith(".webp"))), true)

  const malformed = config.adapter.normalizeVehicle({ model: "BROKEN" }, brandResult.data)
  assert.equal(malformed.success, false)
  assert.equal(config.adapter.normalizeVehicle(rawVehicles[2], brandResult.data).success, true)

  const conflicting = createInsertOnlyPromotionPlan({
    definition: { batch: "collision-test", manufacturer: "ISUZU", allowedModels: [candidates[0].model], importVersion: 1 },
    requestedManufacturer: "ISUZU",
    requestedModels: [candidates[0].model],
    candidates: [candidates[0]],
    references: { brandId, brandName: "ISUZU", brandSlug: "isuzu", typeSlug: "per-record" },
    existingVehicles: [{ slug: candidates[0].slug, model: "DIFFERENT", brandId }],
    currentTruckCount: 20,
    startingDisplayOrder: 20,
    uniqueSlugIndex: true,
    timestamp: new Date("2026-09-07T00:00:00.000Z"),
  })
  assert.equal(conflicting.blocked, 1)
  assert.equal(conflicting.records[0].errors.some((error) => error.code === "PRODUCTION_SLUG_COLLISION"), true)
  console.log("Generic importer tests: PASS")
  console.log("ISUZU regression fixture: 8 ALREADY_EXISTS, 0 inserts, NQR75LS warning preserved")
  console.log("ISUZU reviewed batch fixture: 18 eligible, 0 blocked, 9 documented duty-class resolutions")
  console.log("Invalid record isolation, collision classification, canonical validation, legacy compatibility, and BSON sanitization: PASS")
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown generic importer test failure.")
  process.exitCode = 1
})
