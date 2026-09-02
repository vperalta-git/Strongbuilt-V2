import type { Db } from "mongodb"
import { getInquiriesCollection, getQuoteRequestsCollection } from "@/lib/db/collections"

export async function prepareOperationalCollections(db: Db) {
  const inquiries = getInquiriesCollection(db)
  const quoteRequests = getQuoteRequestsCollection(db)

  const [inquiriesBefore, quoteRequestsBefore] = await Promise.all([
    inquiries.countDocuments(),
    quoteRequests.countDocuments(),
  ])

  await Promise.all([
    inquiries.createIndex({ createdAt: -1 }, { name: "inquiries_created_desc" }),
    inquiries.createIndex({ status: 1, createdAt: -1 }, { name: "inquiries_status_created" }),
    inquiries.createIndex({ email: 1 }, { name: "inquiries_email" }),
    quoteRequests.createIndex({ createdAt: -1 }, { name: "quote_requests_created_desc" }),
    quoteRequests.createIndex({ status: 1 }, { name: "quote_requests_status" }),
  ])

  const [inquiriesAfter, quoteRequestsAfter] = await Promise.all([
    inquiries.countDocuments(),
    quoteRequests.countDocuments(),
  ])
  if (inquiriesBefore !== inquiriesAfter || quoteRequestsBefore !== quoteRequestsAfter) {
    throw new Error("Operational inquiry counts changed during seeding; the seed was stopped.")
  }

  return { inquiries: inquiriesAfter, quoteRequests: quoteRequestsAfter }
}
