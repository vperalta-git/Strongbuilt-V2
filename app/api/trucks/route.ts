import { NextResponse } from "next/server"
import { getTrucks } from "@/lib/data/trucks"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const brand = url.searchParams.get("brand")?.trim().toLowerCase()
  const bodyType = url.searchParams.get("type")?.trim().toLowerCase()
  const featured = url.searchParams.get("featured")

  const trucks = (await getTrucks()).filter((truck) => {
    return (
      (!brand || truck.brand.toLowerCase() === brand) &&
      (!bodyType || truck.bodyType.toLowerCase() === bodyType) &&
      (featured !== "true" || truck.featured)
    )
  })

  return NextResponse.json({
    data: trucks,
    count: trucks.length,
    source: process.env.MONGODB_URI ? "mongodb" : "mock",
  })
}
