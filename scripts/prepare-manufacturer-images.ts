import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import sharp from "sharp"
import { getManufacturerConfiguration } from "@/lib/imports/core/registry"
import { optimizedLocalImagePath, publicImageFilePath } from "@/lib/imports/core/images"

type RawImage = {
  url?: string | null
  sourcePage?: string
  localPathSuggested?: string
}

type RawVehicle = {
  model?: string
  slug?: string
  source?: { productUrl?: string }
  images?: RawImage[]
}

async function download(url: string, referer?: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; StrongbuiltCatalog/1.0; +https://strongbuilt.com.ph)",
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
      ...(referer ? { referer } : {}),
    },
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (!buffer.length) throw new Error("empty response")
  return buffer
}

async function main() {
  const requested = process.argv.slice(2).filter((argument) => !argument.startsWith("--"))
  if (!requested.length) throw new Error("Provide at least one manufacturer slug.")
  const overwrite = process.argv.includes("--overwrite")
  const cache = new Map<string, Promise<Buffer>>()

  for (const manufacturer of requested) {
    const config = getManufacturerConfiguration(manufacturer)
    const vehicles = JSON.parse(await readFile(config.sourceFiles.vehicles, "utf8")) as RawVehicle[]
    const jobs: Array<{ vehicle: RawVehicle; image?: RawImage }> = []
    for (const vehicle of vehicles) {
      const images = (vehicle.images || []).filter((image) => image.url && image.localPathSuggested)
      if (images.length) jobs.push(...images.map((image) => ({ vehicle, image })))
      else jobs.push({ vehicle })
    }
    const records: Array<Record<string, unknown>> = new Array(jobs.length)
    let nextJob = 0
    async function worker() {
      while (nextJob < jobs.length) {
        const index = nextJob++
        const { vehicle, image } = jobs[index]
        if (!image?.url || !image.localPathSuggested) {
          records[index] = { model: vehicle.model, slug: vehicle.slug, status: "FALLBACK_REQUIRED", reason: "No verified direct official image URL." }
          continue
        }
        const publicPath = optimizedLocalImagePath(image.localPathSuggested)
        const target = publicImageFilePath(publicPath)
        const temporary = `${target}.tmp`
        await mkdir(dirname(target), { recursive: true })
        try {
          if (!overwrite) {
            try {
              const metadata = await sharp(target).metadata()
              records[index] = { model: vehicle.model, slug: vehicle.slug, sourceUrl: image.url, localPath: publicPath, status: "REUSED", width: metadata.width, height: metadata.height }
              continue
            } catch {
              // Missing or invalid local files are downloaded below.
            }
          }
          const source = cache.get(image.url) || download(image.url, image.sourcePage || vehicle.source?.productUrl)
          cache.set(image.url, source)
          const buffer = await source
          const result = await sharp(buffer)
            .rotate()
            .resize({ width: 1600, height: 1200, fit: "inside", withoutEnlargement: true })
            .webp({ quality: 84, effort: 5 })
            .toFile(temporary)
          await rename(temporary, target)
          records[index] = {
            model: vehicle.model,
            slug: vehicle.slug,
            sourceUrl: image.url,
            localPath: publicPath,
            status: result.width >= 300 && result.height >= 200 ? "READY" : "READY_LOW_RESOLUTION",
            width: result.width,
            height: result.height,
            bytes: result.size,
          }
        } catch (error) {
          await unlink(temporary).catch(() => undefined)
          records[index] = { model: vehicle.model, slug: vehicle.slug, sourceUrl: image.url, localPath: publicPath, status: "FALLBACK_REQUIRED", reason: error instanceof Error ? error.message : "Unknown image migration failure." }
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(6, jobs.length) }, () => worker()))

    const ready = records.filter((record) => ["READY", "REUSED"].includes(String(record.status))).length
    const lowResolution = records.filter((record) => record.status === "READY_LOW_RESOLUTION").length
    const fallback = records.filter((record) => record.status === "FALLBACK_REQUIRED").length
    const report = {
      manufacturer: config.slug,
      generatedAt: new Date().toISOString(),
      summary: { sourceRecords: vehicles.length, imagesReady: ready, lowResolution, fallbackRequired: fallback },
      records,
    }
    const reportPath = resolve(`data/imports/reports/${config.slug}/image-migration.json`)
    await mkdir(dirname(reportPath), { recursive: true })
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8")
    console.log(`${config.displayName}: ready=${ready}, low-resolution=${lowResolution}, fallback=${fallback}`)
    console.log(`report: ${reportPath}`)
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Unknown image preparation failure.")
  process.exitCode = 1
})
