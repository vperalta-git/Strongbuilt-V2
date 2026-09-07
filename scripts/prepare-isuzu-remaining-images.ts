import assert from "node:assert/strict"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import sharp from "sharp"
import { getManufacturerConfiguration } from "@/lib/imports/core/registry"

const batchId = "isuzu-remaining-001"
const outputRoot = resolve("public/images/trucks/isuzu")
const protectedSlugs = new Set([
  "isuzu-nmr85hs", "isuzu-nqr75ls", "isuzu-qlr77e", "isuzu-nlr85es",
  "isuzu-nlr77h", "isuzu-nlr85e", "isuzu-nmr85h", "isuzu-npr85k",
])

async function main() {
  const config = getManufacturerConfiguration("isuzu")
  const batchModels = config.reviewedBatches?.[batchId]
  assert.ok(batchModels, `Missing reviewed batch ${batchId}.`)
  const brands = JSON.parse(await readFile(config.sourceFiles.brands, "utf8")) as unknown[]
  const vehicles = JSON.parse(await readFile(config.sourceFiles.vehicles, "utf8")) as unknown[]
  const brand = brands.map((record) => config.adapter.parseBrand(record)).find((result) => result.success)
  assert.ok(brand?.success, "ISUZU brand source is invalid.")
  const requested = new Set(batchModels)
  const selected = vehicles.flatMap((raw) => {
    const result = config.adapter.normalizeVehicle(raw, brand.data)
    return result.success && result.input.model && requested.has(result.input.model) ? [{ raw, result }] : []
  })
  assert.equal(selected.length, batchModels.length, "The reviewed image batch is incomplete.")

  const targets = selected.map(({ result }) => {
    assert.equal(result.input.images.length, 1, `${result.input.model} must have exactly one source image.`)
    const image = result.input.images[0]
    assert.ok(image.sourceUrl, `${result.input.model} lacks official image provenance.`)
    assert.ok(image.suggestedLocalPath?.endsWith(".webp"), `${result.input.model} lacks a normalized WebP target.`)
    assert.ok(!protectedSlugs.has(result.input.slug), `${result.input.slug} is an existing protected image.`)
    const filename = image.suggestedLocalPath?.split("/").at(-1)
    assert.ok(filename, `${result.input.model} has an invalid target path.`)
    return { model: result.input.model, slug: result.input.slug, sourceUrl: image.sourceUrl, filename }
  })
  assert.equal(new Set(targets.map((target) => target.filename)).size, targets.length, "Reviewed image filenames collide.")
  assert.equal(new Set(targets.map((target) => target.sourceUrl)).size, targets.length, "Reviewed records unexpectedly share an official image URL.")

  const converted = []
  for (const target of targets) {
    const response = await fetch(target.sourceUrl, {
      headers: { "user-agent": "Strongbuilt catalog asset migration/1.0" },
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok) throw new Error(`${target.model} image request failed: HTTP ${response.status}.`)
    const source = Buffer.from(await response.arrayBuffer())
    const pipeline = sharp(source, { failOn: "warning" }).rotate().resize({
      width: 1600,
      height: 1200,
      fit: "inside",
      withoutEnlargement: true,
    })
    const output = await pipeline.webp({ quality: 84, alphaQuality: 90, effort: 6 }).toBuffer({ resolveWithObject: true })
    converted.push({ ...target, data: output.data, width: output.info.width, height: output.info.height, bytes: output.info.size })
  }

  await mkdir(outputRoot, { recursive: true })
  for (const image of converted) await writeFile(resolve(outputRoot, image.filename), image.data, { flag: "wx" })
  for (const image of converted) console.log(`${image.model}: ${image.filename} (${image.width}x${image.height}, ${image.bytes} bytes)`)
  console.log(`Prepared ${converted.length} official ISUZU images for ${batchId}; protected existing assets changed: 0`)
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown ISUZU image preparation failure.")
  process.exitCode = 1
})
