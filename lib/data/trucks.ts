import type { WithId } from "mongodb"
import { getMongoDatabase, isMongoConfigured } from "@/lib/db/mongodb"
import { collections } from "@/lib/db/collections"
import { mockTrucks } from "@/lib/data/mock-trucks"
import type { Truck } from "@/types/truck"

function serializeTruck(document: WithId<Omit<Truck, "_id">>): Truck {
  return { ...document, _id: document._id.toHexString() }
}

export async function getTrucks(): Promise<Truck[]> {
  if (!isMongoConfigured()) return mockTrucks

  try {
    const db = await getMongoDatabase()
    const documents = await db
      .collection<Omit<Truck, "_id">>(collections.products)
      .find({ active: true })
      .sort({ displayOrder: 1, model: 1 })
      .toArray()

    return documents.map(serializeTruck)
  } catch (error) {
    console.error("MongoDB products are unavailable.", error)
    return process.env.NODE_ENV === "production" ? [] : mockTrucks
  }
}

export async function getTruckBySlug(slug: string): Promise<Truck | null> {
  const trucks = await getTrucks()
  return trucks.find((truck) => truck.slug === slug) ?? null
}

export async function getFeaturedTrucks(limit = 6): Promise<Truck[]> {
  const trucks = await getTrucks()
  return trucks.filter((truck) => truck.featured).slice(0, limit)
}

export async function getRelatedTrucks(truck: Truck, limit = 3): Promise<Truck[]> {
  const trucks = await getTrucks()
  const matched = trucks
    .filter(
      (candidate) =>
        candidate.slug !== truck.slug &&
        (candidate.bodyType === truck.bodyType || candidate.brand === truck.brand),
    )

  const fallback = trucks.filter(
    (candidate) => candidate.slug !== truck.slug && !matched.some((match) => match.slug === candidate.slug),
  )

  return [...matched, ...fallback].slice(0, limit)
}
