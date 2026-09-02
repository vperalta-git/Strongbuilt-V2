import { getFeaturedVehicles, getVehicleBySlug, getVehicles } from "@/lib/data/vehicles"
import { vehicleToLegacyTruck } from "@/lib/data/truck-compatibility"
import type { Truck } from "@/types/truck"

function adaptVehiclesSafely(vehicles: Awaited<ReturnType<typeof getVehicles>>) {
  return vehicles.flatMap((vehicle) => {
    try {
      return [vehicleToLegacyTruck(vehicle)]
    } catch {
      console.warn(`Skipped vehicle ${vehicle.slug}; it has no safe legacy Truck projection.`)
      return []
    }
  })
}

export async function getTrucks(): Promise<Truck[]> {
  return adaptVehiclesSafely(await getVehicles())
}

export async function getTruckBySlug(slug: string): Promise<Truck | null> {
  const vehicle = await getVehicleBySlug(slug)
  if (!vehicle) return null
  try {
    return vehicleToLegacyTruck(vehicle)
  } catch {
    console.warn(`Skipped vehicle ${vehicle.slug}; it has no safe legacy Truck projection.`)
    return null
  }
}

export async function getFeaturedTrucks(limit = 6): Promise<Truck[]> {
  return adaptVehiclesSafely(await getFeaturedVehicles(limit))
}

export async function getRelatedTrucks(truck: Truck, limit = 3): Promise<Truck[]> {
  const trucks = await getTrucks()
  const matched = trucks.filter(
    (candidate) =>
      candidate.slug !== truck.slug &&
      (candidate.bodyType === truck.bodyType || candidate.brand === truck.brand),
  )
  const fallback = trucks.filter(
    (candidate) => candidate.slug !== truck.slug && !matched.some((match) => match.slug === candidate.slug),
  )
  return [...matched, ...fallback].slice(0, limit)
}
