import { MongoClient, type Db } from "mongodb"

type MongoGlobal = typeof globalThis & {
  _strongbuiltMongoPromise?: Promise<MongoClient>
}

export function isMongoConfigured() {
  return Boolean(process.env.MONGODB_URI?.trim())
}

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI?.trim()
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.")
  }

  const globalWithMongo = globalThis as MongoGlobal

  if (!globalWithMongo._strongbuiltMongoPromise) {
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5_000,
    })
    globalWithMongo._strongbuiltMongoPromise = client.connect().catch(async (error: unknown) => {
      delete globalWithMongo._strongbuiltMongoPromise
      await client.close().catch(() => undefined)
      throw error
    })
  }

  return globalWithMongo._strongbuiltMongoPromise
}

export async function getMongoDatabase(): Promise<Db> {
  const client = await getClientPromise()
  return client.db(process.env.MONGODB_DB?.trim() || "strongbuilt")
}

export async function pingMongoDatabase() {
  const db = await getMongoDatabase()
  await db.command({ ping: 1 })
}

export async function closeMongoConnection() {
  const globalWithMongo = globalThis as MongoGlobal
  const clientPromise = globalWithMongo._strongbuiltMongoPromise
  if (!clientPromise) return

  delete globalWithMongo._strongbuiltMongoPromise
  const client = await clientPromise.catch(() => undefined)
  await client?.close()
}
