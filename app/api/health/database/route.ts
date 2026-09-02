import { NextResponse } from "next/server"
import { getTrucksCollection } from "@/lib/db/collections"
import { getMongoDatabase, isMongoConfigured, pingMongoDatabase } from "@/lib/db/mongodb"

export const dynamic = "force-dynamic"

export async function GET() {
  if (!isMongoConfigured()) {
    return NextResponse.json(
      {
        connected: false,
        catalogSource: "mock",
        message: "MongoDB is not configured.",
      },
      { status: 503 },
    )
  }

  try {
    await pingMongoDatabase()
    const db = await getMongoDatabase()
    const activeTruckCount = await getTrucksCollection(db).countDocuments({ active: true })

    return NextResponse.json({
      connected: true,
      catalogSource: activeTruckCount > 0 ? "mongodb" : "mock",
      activeTruckCount,
    })
  } catch (error) {
    console.error("MongoDB health check failed", error)

    return NextResponse.json(
      {
        connected: false,
        catalogSource: "mock",
        message: "MongoDB is configured but unavailable.",
      },
      { status: 503 },
    )
  }
}
