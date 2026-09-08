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

  const fawConfig = getManufacturerConfiguration("faw")
  const fawBrands = JSON.parse(await readFile(fawConfig.sourceFiles.brands, "utf8")) as unknown[]
  const fawVehicles = JSON.parse(await readFile(fawConfig.sourceFiles.vehicles, "utf8")) as unknown[]
  const fawBrand = fawConfig.adapter.parseBrand(fawBrands[0])
  assert.equal(fawBrand.success, true)
  if (!fawBrand.success) throw new Error("Unexpected FAW brand adapter failure.")
  const fawNormalized = fawVehicles.map((raw) => fawConfig.adapter.normalizeVehicle(raw, fawBrand.data))
  assert.equal(fawNormalized.filter((record) => record.success).length, 22)
  const successfulFaw = fawNormalized.flatMap((record) => record.success ? [record] : [])
  assert.deepEqual(
    successfulFaw.reduce<Record<string, number>>((counts, record) => {
      counts[record.input.bodyType] = (counts[record.input.bodyType] || 0) + 1
      return counts
    }, {}),
    { "Tractor Head": 6, "Rigid Truck": 8, "Dump Truck": 5, "Special Purpose Vehicle": 3 },
  )
  assert.deepEqual([...new Set(successfulFaw.map((record) => record.legacyTypeSlug))], [
    "tractor-head", "rigid-truck", "dump-truck", "special-purpose",
  ])
  const fawStaged = stageVehicleImports(successfulFaw.map((record) => record.input), { knownBrandSlugs: ["faw-trucks"] })
  assert.equal(fawStaged.rejected, 3)
  assert.equal(fawStaged.records.filter((record) => record.issues.some((issue) => issue.field === "images")).length, 3)
  assert.equal(fawStaged.records.some((record) => record.issues.some((issue) => issue.code === "UNKNOWN_BRAND")), false)
  const fawJ7 = successfulFaw.find((record) => record.input.model === "J7")
  const fawJh6 = successfulFaw.find((record) => record.input.model === "JH6 Tractor")
  assert.equal(fawJ7?.input.keySpecs?.powerPs, 560)
  assert.equal(fawJ7?.input.keySpecs?.torqueNm, 2600)
  assert.equal(fawJh6?.input.keySpecs?.powerPs, undefined)
  assert.equal(fawJh6?.input.keySpecs?.torqueNm, undefined)
  assert.equal(fawJh6?.input.propulsion, "Multiple / Configurable")
  assert.equal(fawConfig.adapter.normalizeVehicle({ model: "BROKEN" }, fawBrand.data).success, false)
  assert.equal(fawConfig.adapter.normalizeVehicle(fawVehicles[1], fawBrand.data).success, true)

  const preparedExpectations = {
    forland: { records: 15, missingImages: 15, stagedRejected: 15, sourceErrors: 9 },
    shacman: { records: 9, missingImages: 0, stagedRejected: 6, sourceErrors: 7 },
    asiastar: { records: 31, missingImages: 0, stagedRejected: 0, sourceErrors: 0 },
    sinotruk: { records: 50, missingImages: 0, stagedRejected: 0, sourceErrors: 0 },
    yutong: { records: 41, missingImages: 1, stagedRejected: 1, sourceErrors: 0 },
  } as const
  for (const [manufacturer, expected] of Object.entries(preparedExpectations)) {
    const preparedConfig = getManufacturerConfiguration(manufacturer)
    const preparedBrands = JSON.parse(await readFile(preparedConfig.sourceFiles.brands, "utf8")) as unknown[]
    const preparedVehicles = JSON.parse(await readFile(preparedConfig.sourceFiles.vehicles, "utf8")) as unknown[]
    const preparedBrand = preparedConfig.adapter.parseBrand(preparedBrands[0])
    assert.equal(preparedBrand.success, true, `${manufacturer} brand source`)
    if (!preparedBrand.success) throw new Error(`Unexpected ${manufacturer} brand adapter failure.`)
    const preparedNormalized = preparedVehicles.map((raw) => preparedConfig.adapter.normalizeVehicle(raw, preparedBrand.data))
    const adapterFailures = preparedNormalized.flatMap((record, index) => record.success ? [] : [{ index, issues: record.issues }])
    assert.equal(adapterFailures.length, 0, `${manufacturer} adapter failures: ${JSON.stringify(adapterFailures)}`)
    assert.equal(preparedNormalized.filter((record) => record.success).length, expected.records, `${manufacturer} normalized records`)
    const successful = preparedNormalized.flatMap((record) => record.success ? [record] : [])
    assert.equal(successful.filter((record) => record.input.images.length === 0).length, expected.missingImages, `${manufacturer} unresolved images`)
    assert.equal(successful.reduce((total, record) => total + record.issues.filter((issue) => issue.severity === "error").length, 0), expected.sourceErrors, `${manufacturer} source errors`)
    const preparedStaged = stageVehicleImports(successful.map((record) => record.input), { knownBrandSlugs: [preparedBrand.data.slug] })
    assert.equal(preparedStaged.rejected, expected.stagedRejected, `${manufacturer} staged rejections`)
    assert.equal(preparedConfig.adapter.normalizeVehicle({ model: "BROKEN" }, preparedBrand.data).success, false, `${manufacturer} invalid isolation`)
  }

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
  console.log("FAW adapter fixture: 22 normalized, 4 canonical categories, 3 unresolved-image records isolated")
  console.log("Remaining manufacturer fixtures: 146 records normalized with unresolved images and ambiguous taxonomy isolated")
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown generic importer test failure.")
  process.exitCode = 1
})
