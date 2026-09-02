import { randomUUID } from "node:crypto"
import { ObjectId } from "mongodb"
import { getInquiriesCollection, getQuoteRequestsCollection } from "@/lib/db/collections"
import { getMongoDatabase, isMongoConfigured } from "@/lib/db/mongodb"
import { getTrucks } from "@/lib/data/trucks"
import type { ValidatedInquiry } from "@/lib/validation/inquiry"
import type { InquiryDocument, QuoteRequestDocument, SelectedTruckSnapshot } from "@/types/database"

function optional(value: string) {
  return value || undefined
}

async function resolveSelectedTruck(label: string): Promise<SelectedTruckSnapshot | undefined> {
  if (!label) return undefined
  const normalized = label.trim().toLowerCase()
  const trucks = await getTrucks()
  const truck = trucks.find((candidate) =>
    [candidate.slug, candidate.model, `${candidate.brand} ${candidate.model}`]
      .some((value) => value.toLowerCase() === normalized),
  )
  if (!truck) return undefined

  return {
    ...(truck._id ? { truckId: new ObjectId(truck._id) } : {}),
    brand: truck.brand,
    model: truck.model,
    slug: truck.slug,
  }
}

export async function saveInquiry(payload: ValidatedInquiry) {
  if (payload.website) throw new Error("Spam submission rejected.")
  if (!isMongoConfigured()) return { stored: false }

  const db = await getMongoDatabase()
  const timestamp = new Date()

  if (payload.source === "quote") {
    const quoteRequest: QuoteRequestDocument = {
      reference: `SBQ-${timestamp.toISOString().slice(0, 10).replaceAll("-", "")}-${randomUUID().slice(0, 8).toUpperCase()}`,
      name: payload.name,
      company: optional(payload.company),
      email: optional(payload.email),
      phone: optional(payload.phone),
      preferredContact: payload.preferredContact,
      selectedTruck: await resolveSelectedTruck(payload.selectedTruck),
      selectedTruckLabel: optional(payload.selectedTruck),
      truckRequirement: optional(payload.truckRequirement),
      intendedApplication: optional(payload.intendedApplication),
      message: optional(payload.message),
      source: "quote",
      status: "new",
      createdAt: timestamp,
      updatedAt: timestamp,
    }
    await getQuoteRequestsCollection(db).insertOne(quoteRequest)
    return { stored: true }
  }

  const inquiry: InquiryDocument = {
    name: payload.name,
    company: optional(payload.company),
    email: payload.email,
    phone: payload.phone,
    preferredContact: payload.preferredContact,
    message: optional(payload.message),
    source: "contact",
    status: "new",
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await getInquiriesCollection(db).insertOne(inquiry)
  return { stored: true }
}
