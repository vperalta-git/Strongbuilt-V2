import type { Industry } from "@/types/truck"

export const industries: Industry[] = [
  {
    slug: "logistics",
    name: "Logistics & Distribution",
    eyebrow: "Move more, plan better",
    summary: "Cargo and tractor-head configurations aligned with route, volume, and loading requirements.",
    description:
      "From city distribution to port and regional haulage, the right platform depends on route conditions, payload, body access, and dispatch frequency. Strongbuilt helps buyers compare those requirements before choosing a unit.",
    image: { url: "/images/industries/logistics.png", alt: "Commercial truck serving a logistics operation" },
    applications: ["Last-mile delivery", "Regional distribution", "Container hauling", "Warehouse transfer"],
    recommendedBodyTypes: ["Cargo", "Tractor Head", "Trailer"],
  },
  {
    slug: "construction",
    name: "Construction",
    eyebrow: "Built around the site",
    summary: "Dump, boom, and heavy-duty units for materials movement and site support.",
    description:
      "Construction fleets need vehicles matched to access constraints, material type, duty cycle, and loading method. We help define the chassis and body combination around the actual worksite.",
    image: { url: "/images/industries/construction.png", alt: "Heavy truck operating at a construction site" },
    applications: ["Aggregate hauling", "Site materials", "Lifting support", "Equipment movement"],
    recommendedBodyTypes: ["Dump Truck", "Specialized / Custom", "Trailer"],
  },
  {
    slug: "agriculture",
    name: "Agriculture",
    eyebrow: "From source to market",
    summary: "Practical cargo and custom bodies for farm inputs, produce, and rural operations.",
    description:
      "Agricultural transport changes with crop, loading pattern, road condition, and distance to market. Strongbuilt can help define an open, enclosed, or purpose-built body around those needs.",
    image: { url: "/images/industries/agriculture.png", alt: "Commercial truck supporting an agricultural operation" },
    applications: ["Produce transport", "Farm inputs", "Field service", "Market distribution"],
    recommendedBodyTypes: ["Cargo", "Specialized / Custom"],
  },
  {
    slug: "cold-chain",
    name: "Cold Chain",
    eyebrow: "Protect every load",
    summary: "Chassis sourcing and refrigerated-body coordination for temperature-sensitive distribution.",
    description:
      "Cold-chain vehicles need the chassis, insulation, refrigeration unit, door layout, and operating route to work as one system. Strongbuilt can coordinate the base vehicle and body requirement for the intended application.",
    image: { url: "/images/industries/logistics.png", alt: "Distribution truck suited to cold-chain route planning" },
    applications: ["Food distribution", "Grocery routes", "Temperature-sensitive cargo", "Institutional supply"],
    recommendedBodyTypes: ["Specialized / Custom", "Cargo"],
  },
  {
    slug: "manufacturing",
    name: "Manufacturing",
    eyebrow: "Keep production moving",
    summary: "Fleet configurations for inbound materials, plant transfers, and finished-goods delivery.",
    description:
      "Manufacturing transport calls for predictable loading, safe cargo handling, and dependable route performance. We help buyers compare cargo bodies, tractor heads, and trailers around that workflow.",
    image: { url: "/images/industries/fleet-operations.png", alt: "Commercial fleet supporting manufacturing operations" },
    applications: ["Raw material movement", "Plant transfer", "Finished goods", "Supplier collection"],
    recommendedBodyTypes: ["Cargo", "Tractor Head", "Trailer"],
  },
  {
    slug: "waste-management",
    name: "Waste Management",
    eyebrow: "Purpose-built operations",
    summary: "Custom vehicle and body planning for collection, hauling, and environmental services.",
    description:
      "Waste operations vary by collection method, route density, material, and disposal point. Strongbuilt works from those operating details to define a suitable commercial platform and body solution.",
    image: { url: "/images/industries/waste-management.png", alt: "Specialized commercial vehicle for waste-management work" },
    applications: ["Collection routes", "Bulk transfer", "Facility support", "Environmental services"],
    recommendedBodyTypes: ["Specialized / Custom", "Dump Truck"],
  },
]
