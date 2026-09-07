import { readFile } from "node:fs/promises"
import { resolve } from "node:path"
import type { ManufacturerConfiguration, ManufacturerImportIssue } from "@/lib/imports/core/types"

export type LoadedManufacturerSource = {
  brandRecords: unknown[]
  vehicleRecords: unknown[]
  files: {
    brands: { path: string; records: number }
    vehicles: { path: string; records: number }
  }
}

function asRecordArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must contain a JSON array.`)
  return value
}

async function readJsonArray(path: string, label: string) {
  const absolutePath = resolve(path)
  let source: string
  try {
    source = await readFile(absolutePath, "utf8")
  } catch (error) {
    const reason = error instanceof Error ? error.message : "unknown filesystem error"
    throw new Error(`Unable to read ${label} source ${path}: ${reason}`)
  }
  try {
    return asRecordArray(JSON.parse(source) as unknown, label)
  } catch (error) {
    const reason = error instanceof Error ? error.message : "invalid JSON"
    throw new Error(`Unable to parse ${label} source ${path}: ${reason}`)
  }
}

export async function loadManufacturerSource(config: ManufacturerConfiguration): Promise<LoadedManufacturerSource> {
  const [brandRecords, vehicleRecords] = await Promise.all([
    readJsonArray(config.sourceFiles.brands, `${config.displayName} brand`),
    readJsonArray(config.sourceFiles.vehicles, `${config.displayName} vehicle`),
  ])
  return {
    brandRecords,
    vehicleRecords,
    files: {
      brands: { path: config.sourceFiles.brands, records: brandRecords.length },
      vehicles: { path: config.sourceFiles.vehicles, records: vehicleRecords.length },
    },
  }
}

export function sourceIssue(message: string, index: number): ManufacturerImportIssue {
  return {
    severity: "error",
    field: "document",
    message,
    reason: message,
    code: "INVALID_SOURCE_SHAPE",
    sourceValue: { index },
  }
}
