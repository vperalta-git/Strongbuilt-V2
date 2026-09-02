import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"
import type { AnyBulkWriteOperation, Collection, Document } from "mongodb"

export type SeedReport = {
  count: number
  inserted: number
  updated: number
}

export function loadLocalEnvironment() {
  const path = resolve(process.cwd(), ".env.local")
  if (!existsSync(path)) return

  for (const sourceLine of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = sourceLine.trim()
    if (!line || line.startsWith("#")) continue
    const separator = line.indexOf("=")
    if (separator < 1) continue

    const key = line.slice(0, separator).trim()
    let value = line.slice(separator + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

export function assertUnique(values: string[], label: string) {
  const normalized = values.map((value) => value.trim().toLowerCase())
  const duplicates = normalized.filter((value, index) => normalized.indexOf(value) !== index)
  if (duplicates.length) throw new Error(`Duplicate ${label}: ${[...new Set(duplicates)].join(", ")}`)
}

export async function syncBySlug<T extends Document>(
  collection: Collection<T>,
  records: Array<{ slug: string } & Record<string, unknown>>,
  timestamp: Date,
): Promise<SeedReport> {
  if (!records.length) return { count: 0, inserted: 0, updated: 0 }

  const operations = records.map((record) => ({
    updateOne: {
      filter: { slug: record.slug },
      update: {
        $set: { ...record, updatedAt: timestamp },
        $setOnInsert: { createdAt: timestamp },
      },
      upsert: true,
    },
  })) as unknown as AnyBulkWriteOperation<T>[]

  const result = await collection.bulkWrite(operations, { ordered: true })
  return {
    count: records.length,
    inserted: result.upsertedCount,
    updated: result.modifiedCount,
  }
}
