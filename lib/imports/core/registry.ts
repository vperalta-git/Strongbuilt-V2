import type { ManufacturerConfiguration } from "@/lib/imports/core/types"
import { asiastarAdapter } from "@/lib/imports/manufacturers/asiastar"
import { asiastarReviewedBatches } from "@/lib/imports/manufacturers/asiastar-review"
import { fawAdapter } from "@/lib/imports/manufacturers/faw"
import { forlandAdapter } from "@/lib/imports/manufacturers/forland"
import { isuzuAdapter } from "@/lib/imports/manufacturers/isuzu"
import { shacmanAdapter } from "@/lib/imports/manufacturers/shacman"
import { sinotrukAdapter } from "@/lib/imports/manufacturers/sinotruk"
import { yutongAdapter } from "@/lib/imports/manufacturers/yutong"

function configuration(
  slug: string,
  displayName: string,
  adapter: ManufacturerConfiguration["adapter"],
  options: Partial<Pick<ManufacturerConfiguration, "brandAliases" | "defaultTaxonomyHints" | "legacyTypeAliases" | "knownSourceWarnings" | "allowedVehicleFamilies">> = {},
): ManufacturerConfiguration {
  return {
    slug,
    displayName,
    sourceFiles: {
      brands: `data/imports/raw/${slug}/${slug}_brands.json`,
      vehicles: `data/imports/raw/${slug}/${slug}_trucks.json`,
    },
    brandAliases: options.brandAliases || [displayName, slug],
    defaultTaxonomyHints: options.defaultTaxonomyHints || {},
    legacyTypeAliases: options.legacyTypeAliases || {},
    image: {
      localAssetDirectory: `/images/trucks/${slug}/`,
      allowRemoteSourceAsProvenance: true,
    },
    knownSourceWarnings: options.knownSourceWarnings || [],
    allowedVehicleFamilies: options.allowedVehicleFamilies || ["Truck"],
    importVersion: 1,
    adapter,
  }
}

export const manufacturerRegistry = {
  isuzu: configuration("isuzu", "ISUZU", isuzuAdapter, {
    brandAliases: ["ISUZU", "Isuzu", "isuzu"],
    legacyTypeAliases: {
      "light-commercial": "cargo",
      "rigid-truck": "cargo",
      "tractor-head": "tractor-head",
      puv: "bus",
      bus: "bus",
    },
    allowedVehicleFamilies: ["Truck", "Bus", "PUV"],
    knownSourceWarnings: ["Preserve manufacturer discrepancies verbatim, including the NQR75LS power warning."],
  }),
  faw: configuration("faw", "FAW", fawAdapter, {
    brandAliases: ["FAW", "FAW TRUCKS", "faw", "faw-trucks"],
    legacyTypeAliases: {
      "rigid-truck": "cargo",
      "tractor-head": "tractor-head",
      "dump-truck": "dump-truck",
      "special-purpose": "specialized-custom",
    },
    allowedVehicleFamilies: ["Truck", "Special Purpose Vehicle"],
    knownSourceWarnings: ["Preserve regional configuration caveats and unresolved image status."],
  }),
  forland: configuration("forland", "Forland", forlandAdapter, {
    brandAliases: ["Forland", "FORLAND", "forland"],
    legacyTypeAliases: {
      "mini-truck": "cargo",
      "light-truck": "cargo",
      "heavy-duty-truck": "cargo",
      "dump-truck": "dump-truck",
      "special-purpose": "specialized-custom",
    },
    allowedVehicleFamilies: ["Truck", "Special Purpose Vehicle"],
  }),
  shacman: configuration("shacman", "SHACMAN", shacmanAdapter, {
    legacyTypeAliases: {
      "rigid-truck": "cargo",
      "tractor-head": "tractor-head",
      "special-purpose": "specialized-custom",
    },
    allowedVehicleFamilies: ["Truck", "Special Purpose Vehicle"],
  }),
  asiastar: configuration("asiastar", "ASIASTAR", asiastarAdapter, {
    legacyTypeAliases: { coach: "bus", "intercity-bus": "bus", "city-bus": "bus" },
    allowedVehicleFamilies: ["Bus", "Coach"],
  }),
  sinotruk: configuration("sinotruk", "SINOTRUK", sinotrukAdapter, {
    brandAliases: ["SINOTRUK", "SINOTRUCK", "sinotruk", "sinotruck"],
    legacyTypeAliases: {
      "rigid-truck": "cargo",
      "box-van": "cargo",
      "stake-truck": "cargo",
      "refrigerated-truck": "cargo",
      "wing-van": "cargo",
      "water-tanker": "specialized-custom",
      tanker: "specialized-custom",
      "mixer-truck": "specialized-custom",
      "special-purpose": "specialized-custom",
      "garbage-truck": "specialized-custom",
      "crane-truck": "specialized-custom",
      "dump-trailer": "trailer",
      "tanker-trailer": "trailer",
      "semi-trailer": "trailer",
      "flatbed-trailer": "trailer",
      "lowbed-trailer": "trailer",
      "electric-truck": "cargo",
      "electric-dump-truck": "dump-truck",
      "electric-tractor": "tractor-head",
    },
    allowedVehicleFamilies: ["Truck", "Trailer", "Special Purpose Vehicle"],
  }),
  yutong: configuration("yutong", "YUTONG", yutongAdapter, {
    legacyTypeAliases: {
      "hybrid-city-bus": "bus",
      "electric-city-bus": "bus",
      "electric-articulated-bus": "bus",
      "electric-double-decker-bus": "bus",
      "electric-coach": "bus",
      "city-bus": "bus",
      coach: "bus",
      "apron-bus": "bus",
      "electric-apron-bus": "bus",
      "blood-collection-vehicle": "specialized-custom",
      "medical-vehicle": "specialized-custom",
      ambulance: "specialized-custom",
      "police-special-vehicle": "trailer",
      "prisoner-transport": "specialized-custom",
      "riot-control-vehicle": "specialized-custom",
      "special-purpose": "specialized-custom",
    },
    allowedVehicleFamilies: ["Bus", "Coach", "Trailer", "Special Purpose Vehicle"],
  }),
} as const satisfies Record<string, ManufacturerConfiguration>

manufacturerRegistry.isuzu.reviewedBatches = {
  "isuzu-remaining-001": [
    "TRAVIZ S",
    "TRAVIZ L",
    "NQR75L",
    "FRR90 M",
    "FTR90 M",
    "FVR34 Q",
    "FVM34 W",
    "FVM34 T",
    "FXM60 W",
    "FVR34QS",
    "FRR90MS",
    "FVZ34",
    "GXZ60N",
    "TRAVIZ PUV",
    "NLR77",
    "NPR85",
    "NQR",
    "FVR",
  ],
}

manufacturerRegistry.asiastar.reviewedBatches = asiastarReviewedBatches

export type ManufacturerSlug = keyof typeof manufacturerRegistry

export function getManufacturerConfiguration(input: string): ManufacturerConfiguration {
  const normalized = input.trim().toLowerCase()
  const config = manufacturerRegistry[normalized as ManufacturerSlug]
  if (!config) {
    throw new Error(`Unknown manufacturer "${input}". Supported: ${Object.keys(manufacturerRegistry).join(", ")}.`)
  }
  return config
}
