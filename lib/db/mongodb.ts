import { MongoClient, type Db } from "mongodb"

const uri = process.env.MONGODB_URI
const databaseName = process.env.MONGODB_DB || "strongbuilt"

type MongoGlobal = typeof globalThis & {
  _strongbuiltMongoPromise?: Promise<MongoClient>
}

export function isMongoConfigured() {
  return Boolean(uri)
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured.")
  }

  const globalWithMongo = globalThis as MongoGlobal

  if (!globalWithMongo._strongbuiltMongoPromise) {
    const client = new MongoClient(uri, { maxPoolSize: 10 })
    globalWithMongo._strongbuiltMongoPromise = client.connect()
  }

  return globalWithMongo._strongbuiltMongoPromise
}

export async function getMongoDatabase(): Promise<Db> {
  const client = await getClientPromise()
  return client.db(databaseName)
}
