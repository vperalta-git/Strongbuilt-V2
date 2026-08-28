import { getMongoDatabase, isMongoConfigured } from "@/lib/db/mongodb"
import { collections } from "@/lib/db/collections"
import type { StoredInquiry } from "@/types/inquiry"
import type { ValidatedInquiry } from "@/lib/validation/inquiry"

export async function saveInquiry(payload: ValidatedInquiry) {
  const { website, ...input } = payload
  if (website) throw new Error("Spam submission rejected.")
  const timestamp = new Date().toISOString()
  const inquiry: StoredInquiry = {
    ...input,
    status: "new",
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  if (!isMongoConfigured()) {
    return { stored: false, inquiry }
  }

  const db = await getMongoDatabase()
  const collection = db.collection<StoredInquiry>(collections.inquiries)

  await Promise.all([
    collection.createIndex({ createdAt: -1 }),
    collection.createIndex({ status: 1, createdAt: -1 }),
    collection.createIndex({ email: 1 }),
  ])
  await collection.insertOne(inquiry)

  return { stored: true, inquiry }
}
