import { createHash } from "node:crypto"
import type { Collection, Db, Document, Filter } from "mongodb"
import {
  getBrandsCollection,
  getInquiriesCollection,
  getQuoteRequestsCollection,
  getTrucksCollection,
  getTruckTypesCollection,
} from "@/lib/db/collections"

const readTimeoutMs = 15_000

export type CatalogCounts = {
  brands: number
  trucks: number
  uniqueTruckSlugs: number
  truckTypes: number
  inquiries: number
  quoteRequests: number
}

export async function catalogCounts(db: Db): Promise<CatalogCounts> {
  const [brands, trucks, uniqueSlugs, truckTypes, inquiries, quoteRequests] = await Promise.all([
    getBrandsCollection(db).countDocuments({}, { maxTimeMS: readTimeoutMs }),
    getTrucksCollection(db).countDocuments({}, { maxTimeMS: readTimeoutMs }),
    getTrucksCollection(db).distinct("slug", {}, { maxTimeMS: readTimeoutMs }),
    getTruckTypesCollection(db).countDocuments({}, { maxTimeMS: readTimeoutMs }),
    getInquiriesCollection(db).countDocuments({}, { maxTimeMS: readTimeoutMs }),
    getQuoteRequestsCollection(db).countDocuments({}, { maxTimeMS: readTimeoutMs }),
  ])
  return { brands, trucks, uniqueTruckSlugs: uniqueSlugs.length, truckTypes, inquiries, quoteRequests }
}

export async function resolveCatalogDatabase(initial: Db) {
  const initialCounts = await catalogCounts(initial)
  if (initialCounts.brands || initialCounts.trucks) return initial
  const databaseList = await initial.admin().listDatabases({ nameOnly: true })
  const candidates: Db[] = []
  for (const { name } of databaseList.databases) {
    if (["admin", "config", "local"].includes(name)) continue
    const candidate = initial.client.db(name)
    const counts = await catalogCounts(candidate)
    if (counts.brands > 0 && counts.trucks > 0) candidates.push(candidate)
  }
  if (candidates.length !== 1) throw new Error(`Unable to identify exactly one catalog database (matches: ${candidates.length}).`)
  return candidates[0]
}

export async function fingerprint<T extends Document>(collection: Collection<T>, filter: Filter<T> = {} as Filter<T>) {
  const documents = await collection.find(filter).sort({ _id: 1 }).maxTimeMS(readTimeoutMs).toArray()
  return createHash("sha256").update(JSON.stringify(documents)).digest("hex")
}
