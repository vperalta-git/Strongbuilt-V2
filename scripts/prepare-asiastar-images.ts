import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import sharp from "sharp"
import { getApprovedLocalTruckImagePath } from "@/lib/data/truck-local-images"
import { getManufacturerConfiguration } from "@/lib/imports/core/registry"
import { asiastarPromotionModels } from "@/lib/imports/manufacturers/asiastar-review"

const outputRoot = resolve("public/images/trucks/asiastar")
const reportPath = resolve("data/imports/reports/asiastar/image-migration.json")

async function main() {
  const config = getManufacturerConfiguration("asiastar")
  assert.equal(asiastarPromotionModels.length, 28, "The reviewed ASIASTAR image set must contain 28 records.")
  assert.equal(new Set(asiastarPromotionModels).size, asiastarPromotionModels.length, "The reviewed ASIASTAR batches overlap.")

  const brands = JSON.parse(await readFile(config.sourceFiles.brands, "utf8")) as unknown[]
  const vehicles = JSON.parse(await readFile(config.sourceFiles.vehicles, "utf8")) as unknown[]
  const brand = brands.map((record) => config.adapter.parseBrand(record)).find((result) => result.success)
  assert.ok(brand?.success, "ASIASTAR brand source is invalid.")
  const requested = new Set<string>(asiastarPromotionModels)
  const selected = vehicles.flatMap((raw) => {
    const result = config.adapter.normalizeVehicle(raw, brand.data)
    return result.success && result.input.model && requested.has(result.input.model) ? [{ result }] : []
  })
  assert.equal(selected.length, asiastarPromotionModels.length, "The reviewed ASIASTAR image set is incomplete.")

  const targets = selected.map(({ result }) => {
    const model = result.input.model
    assert.ok(model, "Every reviewed ASIASTAR record must have a model.")
    assert.equal(result.input.images.length, 1, `${model} must have exactly one source image.`)
    const image = result.input.images[0]
    assert.ok(image.sourceUrl, `${model} lacks official image provenance.`)
    const localPath = getApprovedLocalTruckImagePath(result.input.slug)
    assert.ok(localPath?.endsWith(".webp"), `${model} lacks an approved WebP target.`)
    assert.equal(image.suggestedLocalPath, localPath, `${model} source and approved paths differ.`)
    return {
      model,
      slug: result.input.slug,
      sourceUrl: image.sourceUrl,
      sourcePage: image.sourcePage || result.input.source.productUrl,
      localPath,
      filename: localPath.split("/").at(-1)!,
    }
  })
  assert.equal(new Set(targets.map((target) => target.filename)).size, targets.length, "ASIASTAR filenames collide.")
  assert.equal(new Set(targets.map((target) => target.sourceUrl)).size, targets.length, "Reviewed ASIASTAR records share an image URL.")

  const converted = []
  for (const target of targets) {
    const response = await fetch(target.sourceUrl, {
      headers: {
        "user-agent": "Mozilla/5.0 Strongbuilt catalog asset migration/1.0",
        referer: "https://www.asiastarbuses.com/",
      },
      signal: AbortSignal.timeout(45_000),
    })
    assert.equal(response.ok, true, `${target.model} image request failed: HTTP ${response.status}.`)
    const contentType = response.headers.get("content-type") || ""
    assert.match(contentType, /^image\//i, `${target.model} returned ${contentType || "no content type"}.`)
    const source = Buffer.from(await response.arrayBuffer())
    const sourceMetadata = await sharp(source, { failOn: "warning" }).metadata()
    assert.ok(sourceMetadata.width && sourceMetadata.height, `${target.model} has unreadable dimensions.`)
    const output = await sharp(source, { failOn: "warning" })
      .rotate()
      .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 84, alphaQuality: 90, effort: 6 })
      .toBuffer({ resolveWithObject: true })
    assert.ok(output.info.width > 300 && output.info.height > 200, `${target.model} output resolution is too small.`)
    converted.push({
      ...target,
      sourceContentType: contentType,
      sourceWidth: sourceMetadata.width,
      sourceHeight: sourceMetadata.height,
      sourceBytes: source.length,
      width: output.info.width,
      height: output.info.height,
      bytes: output.info.size,
      sha256: createHash("sha256").update(output.data).digest("hex"),
      data: output.data,
    })
  }

  await mkdir(outputRoot, { recursive: true })
  let filesWritten = 0
  let filesReused = 0
  for (const image of converted) {
    const targetPath = resolve(outputRoot, image.filename)
    if (existsSync(targetPath)) {
      const existing = await readFile(targetPath)
      assert.equal(createHash("sha256").update(existing).digest("hex"), image.sha256, `${image.model} would overwrite a different local asset.`)
      filesReused += 1
    } else {
      await writeFile(targetPath, image.data, { flag: "wx" })
      filesWritten += 1
    }
  }
  const duplicateContentGroups = Object.values(converted.reduce<Record<string, string[]>>((groups, image) => {
    groups[image.sha256] = [...(groups[image.sha256] || []), image.model]
    return groups
  }, {})).filter((models) => models.length > 1)
  await writeFile(reportPath, `${JSON.stringify({
    manufacturer: "asiastar",
    generatedAt: new Date().toISOString(),
    status: "LOCAL_ASSETS_READY",
    filesWritten,
    filesReused,
    uniqueSourceUrls: converted.length,
    duplicateContentGroups,
    records: converted.map(({ data, ...record }) => {
      void data
      return record
    }),
  }, null, 2)}\n`, "utf8")

  for (const image of converted) console.log(`${image.model}: ${image.filename} (${image.width}x${image.height}, ${image.bytes} bytes)`)
  console.log(`Prepared ${converted.length} official ASIASTAR images; wrote ${filesWritten}; reused ${filesReused}; filename collisions: 0; duplicate-content groups: ${duplicateContentGroups.length}.`)
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown ASIASTAR image preparation failure.")
  process.exitCode = 1
})
