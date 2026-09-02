import { NextResponse } from "next/server"
import { isMongoCatalogEnabled, isMongoConfigured, pingMongoDatabase } from "@/lib/db/mongodb"

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

    return NextResponse.json({
      connected: true,
      catalogSource: isMongoCatalogEnabled() ? "mongodb" : "mock",
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
