import type { ManufacturerConfiguration } from "@/lib/imports/core/types"
import { asiastarAdapter } from "@/lib/imports/manufacturers/asiastar"
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
  forland: configuration("forland", "Forland", forlandAdapter),
  shacman: configuration("shacman", "SHACMAN", shacmanAdapter),
  asiastar: configuration("asiastar", "ASIASTAR", asiastarAdapter, { allowedVehicleFamilies: ["Bus", "Coach"] }),
  sinotruk: configuration("sinotruk", "SINOTRUK", sinotrukAdapter),
  yutong: configuration("yutong", "YUTONG", yutongAdapter, { allowedVehicleFamilies: ["Bus", "Coach"] }),
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

export type ManufacturerSlug = keyof typeof manufacturerRegistry

export function getManufacturerConfiguration(input: string): ManufacturerConfiguration {
  const normalized = input.trim().toLowerCase()
  const config = manufacturerRegistry[normalized as ManufacturerSlug]
  if (!config) {
    throw new Error(`Unknown manufacturer "${input}". Supported: ${Object.keys(manufacturerRegistry).join(", ")}.`)
  }
  return config
}
