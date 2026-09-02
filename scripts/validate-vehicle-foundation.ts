import assert from "node:assert/strict"
import { ObjectId } from "mongodb"
import { resolveBrandId } from "@/lib/db/vehicles"
import { createLegacySelectedTruckSnapshot, legacyTruckToVehicle, vehicleToLegacyTruck } from "@/lib/data/truck-compatibility"
import { isolateMongoVehicleDocuments } from "@/lib/data/vehicles"
import { normalizeTaxonomyValue } from "@/lib/domain/vehicle-taxonomy"
import { stageVehicleImports } from "@/lib/imports/normalize-vehicle"
import { mockTrucks } from "@/lib/data/mock-trucks"
import { brandSeeds, truckSeeds, truckTypeSeeds } from "@/scripts/seed-data"

function verifyLegacyAdapter() {
  assert.equal(mockTrucks.length, 12)
  assert.equal(new Set(mockTrucks.map((truck) => truck.slug)).size, 12)

  for (const truck of mockTrucks) {
    const roundTrip = vehicleToLegacyTruck(legacyTruckToVehicle(truck))
    assert.deepEqual(
      JSON.parse(JSON.stringify({ ...roundTrip, _id: undefined, specifications: undefined })),
      JSON.parse(JSON.stringify({ ...truck, _id: undefined, specifications: undefined })),
    )
    for (const group of new Set(truck.specifications.map((specification) => specification.group))) {
      assert.deepEqual(
        roundTrip.specifications.filter((specification) => specification.group === group),
        truck.specifications.filter((specification) => specification.group === group),
      )
    }
  }
}

function buildMongoFixtures() {
  const timestamp = new Date("2026-01-01T00:00:00.000Z")
  const brands = new Map(brandSeeds.map((brand) => {
    const id = new ObjectId()
    return [brand.slug, { id, value: { id: id.toHexString(), name: brand.name, slug: brand.slug } }] as const
  }))
  const types = new Map(truckTypeSeeds.map((type) => {
    const id = new ObjectId()
    return [type.slug, { id, value: { id: id.toHexString(), name: type.name, slug: type.slug } }] as const
  }))
  const documents = truckSeeds.map(({ brandSlug, typeSlug, ...truck }) => ({
    ...truck,
    _id: new ObjectId(),
    brandId: brands.get(brandSlug)!.id,
    typeId: types.get(typeSlug)!.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  }))
  return {
    documents,
    brands: new Map([...brands.values()].map(({ id, value }) => [id.toHexString(), value])),
    types: new Map([...types.values()].map(({ id, value }) => [id.toHexString(), value])),
  }
}

function verifyMongoIsolation() {
  const fixtures = buildMongoFixtures()
  const invalid = { ...fixtures.documents[0], slug: "INVALID SLUG" }
  const result = isolateMongoVehicleDocuments([...fixtures.documents, invalid], fixtures.brands, fixtures.types)
  assert.equal(result.vehicles.length, 12)
  assert.equal(result.issues.length, 1)
  assert.equal(result.issues[0]?.message, "document validation failed")

  for (const [index, vehicle] of result.vehicles.entries()) {
    const legacy = vehicleToLegacyTruck(vehicle)
    assert.equal(legacy.slug, mockTrucks[index]?.slug)
    assert.equal(legacy.brand, mockTrucks[index]?.brand)
    assert.equal(legacy.bodyType, mockTrucks[index]?.bodyType)
  }
}

function verifyBrandResolution() {
  const id = new ObjectId()
  const ids = new Map([["shacman", id]])
  assert.equal(resolveBrandId(" SHACMAN ", ids), id)
  assert.throws(() => resolveBrandId("unknown-brand", ids), /Unknown brand slug/)
}

function importFixture(overrides: Record<string, unknown> = {}) {
  return {
    slug: "example-brand-example-model",
    brandSlug: "example-brand",
    name: "Example Model",
    model: "Example Model",
    vehicleFamily: "trucks",
    bodyType: "cargo",
    dutyClass: "Light Duty",
    propulsion: "Diesel",
    applicationTags: ["Urban Logistics"],
    images: [{
      url: "https://manufacturer.example/images/example-model.webp",
      alt: "Example Model",
      isPrimary: true,
      order: 1,
      sourcePage: "https://manufacturer.example/example-model",
      storageProvider: "external",
    }],
    source: {
      manufacturer: "Example Brand",
      website: "https://manufacturer.example",
      productUrl: "https://manufacturer.example/example-model",
      verifiedAt: "2026-01-01T00:00:00.000Z",
      dataWarnings: ["Demonstration fixture only."],
    },
    ...overrides,
  }
}

function verifyStagingValidation() {
  assert.equal(normalizeTaxonomyValue("vehicleFamily", "trucks"), "Truck")
  assert.equal(normalizeTaxonomyValue("propulsion", "electric"), "Battery Electric")

  const raw = importFixture()
  const validReport = stageVehicleImports([raw], { knownBrandSlugs: ["example-brand"] })
  assert.equal(validReport.total, 1)
  assert.equal(validReport.needsReview, 1)
  assert.equal(validReport.records[0]?.normalized?.vehicleFamily, "Truck")
  assert.equal(validReport.records[0]?.raw, raw)

  const duplicateReport = stageVehicleImports([importFixture(), importFixture()], { knownBrandSlugs: ["example-brand"] })
  assert.equal(duplicateReport.rejected, 2)
  assert.ok(duplicateReport.records.every((record) => record.issues.some((issue) => issue.code === "DUPLICATE_SLUG")))

  const invalidReport = stageVehicleImports([
    importFixture({ brandSlug: "unknown", source: undefined, keySpecs: { horsepower: "many" } }),
  ], { knownBrandSlugs: ["example-brand"] })
  assert.equal(invalidReport.rejected, 1)
}

function verifyLegacyQuoteField() {
  const vehicle = legacyTruckToVehicle(mockTrucks[0])
  vehicle._id = new ObjectId().toHexString()
  const snapshot = createLegacySelectedTruckSnapshot(vehicle)
  assert.ok(snapshot.truckId instanceof ObjectId)
  assert.equal(snapshot.slug, mockTrucks[0]?.slug)
  assert.equal("vehicleId" in snapshot, false)
}

verifyLegacyAdapter()
verifyMongoIsolation()
verifyBrandResolution()
verifyStagingValidation()
verifyLegacyQuoteField()

console.log("Vehicle migration foundation validation passed.")
console.log("12 legacy records, MongoDB isolation, taxonomy, brand resolution, staging QA, and quote compatibility verified.")
