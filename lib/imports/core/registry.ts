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

manufacturerRegistry.shacman.reviewedBatches = {
  "shacman-platforms-001": ["X6000", "X5000", "F3000"],
  "shacman-rigid-001": ["L3000"],
  "shacman-electric-001": ["L6000e"],
  "shacman-port-tractor-001": ["T5000 Port Tractor"],
  "shacman-special-001": ["Specialized Trucks"],
}
manufacturerRegistry.shacman.reviewExclusions = {
  X3000: {
    classification: "EXCLUDED_DUPLICATE",
    reason: "Protected production already contains two X3000 configurations; adding the broad platform-family record would duplicate that represented family.",
  },
  H3000: {
    classification: "EXCLUDED_DUPLICATE",
    reason: "Protected production already contains two H3000 configurations; adding the broad platform-family record would duplicate that represented family.",
  },
}

manufacturerRegistry.sinotruk.reviewedBatches = {
  "sinotruk-heavy-001": [
    "HOWO TX 6×4 Dump Truck", "HOWO TX 8×4 Dump Truck", "HOWO N 6×4 Dump Truck",
    "HOWO N 8×4 Dump Truck", "HOWO 6×4 Dump Truck", "HOWO 8×4 Dump Truck",
    "HOWO T7 6×4 Tractor Truck", "HOWO TX 6×4 Tractor Truck", "HOWO N 4×2 Tractor Truck",
    "HOWO N 6×4 Tractor Truck", "HOWO 6×4 Tractor Truck", "HOWO 4×2 Tractor Truck",
    "HOWO 6×4 Cargo Truck", "HOWO TX 4×2 Cargo Truck", "HOWO TX 8×4 Cargo Truck",
    "HOWO N 6×4 Cargo Truck", "HOWO N 8×4 Cargo Truck",
  ],
  "sinotruk-light-001": [
    "HOWO Cargo Truck", "HOWO Light Cargo Truck", "HOWO Box Van Cargo Truck", "HOWO Light Stake Truck",
    "HOWO Refrigerator Cargo Truck", "HOWO Wing Van Cargo Truck", "HOWO Mini Tipper Truck",
    "HOWO Light Duty Tipper Truck",
  ],
  "sinotruk-special-001": [
    "HOWO Water Tanker", "HOWO Oil Tanker", "HOWO 8×4 Oil Tanker", "HOWO 6×4 Oil Tanker",
    "HOWO N 6×4 Mixer Truck", "HOWO N 8×4 Mixer Truck", "HOWO TX 8×4 Mixer Truck",
    "HOWO T7H 6×4 Mixer Truck", "HOWO T7H 8×4 Mixer Truck", "HOWO 7 6×4 Mixer Truck",
    "HOWO Synchronous Chip Seal / Bitumen Tank", "HOWO Bitumen Sprayer Tank", "HOWO Garbage Truck",
    "HOWO Mounted Crane Truck", "HOWO Small Truck Crane",
  ],
  "sinotruk-trailer-001": [
    "Dump Semi Trailer", "Fuel Tanker Semi Trailer", "Fence Semi Trailer", "Sidewall Semi Trailer",
    "Flatbed Semi Trailer", "Low Bed Semi Trailer",
  ],
  "sinotruk-new-energy-001": [
    "HOWO Pure Electric Light Truck", "HOWO Pure Electric Dump Truck", "HOWO Pure Electric Tractor Truck",
    "Pure Electric Single Side Dock Tractor Truck",
  ],
}

manufacturerRegistry.faw.reviewedBatches = {
  "faw-tractor-001": ["J7", "JH6 Tractor", "J6P Tractor", "NEW J5P Tractor", "NEW J5M Tractor", "J5P Tractor"],
  "faw-rigid-001": ["JK6 Rigid", "J6L Rigid", "Dragon V Rigid", "Tiger VH Rigid", "Tiger VN Rigid", "Tiger VR Rigid", "Baling Rigid", "T80 Rigid"],
  "faw-dump-001": ["JH6 Dump Truck", "J6P Dump Truck", "NEW J5P Dump Truck", "Dragon V Dump Truck", "Tiger V 4x4 Dump Truck"],
  "faw-special-001": ["JH6 Special Purpose", "J6P Special Purpose", "J6L Special Purpose"],
}

manufacturerRegistry.forland.reviewedBatches = {
  "forland-mini-001": ["T5 Mini Truck", "T5e Mini Truck", "T5 EV Mini Truck", "T6 Mini Truck", "T7 Mini Truck"],
  "forland-rigid-001": ["L5 Light Truck", "L5e Light Truck", "L5e EV Light Truck", "L7 Light Truck", "H7 Heavy-duty Truck"],
  "forland-dump-001": ["T5 Dump Truck", "H7 Dump Truck", "L7 Dump Truck", "L5e Dump Truck"],
  "forland-special-001": ["H7 Compactor"],
}

manufacturerRegistry.yutong.reviewedBatches = {
  "yutong-ebus-001": ["H10", "E7S (ZK6706BEVG)", "U12", "E12 (ZK6128BEVG)", "U18", "E12PRO", "U12DD", "U15", "E9 (ZK6890BEVG)"],
  "yutong-ecoach-001": ["T12E", "IC12E (2026)", "T15E", "IC12E", "C13E (ZK6137BEV)", "T14E", "C11E (ZK6117BEV)", "C9E (ZK6907BEV)", "D8E (ZK6772BEV)"],
  "yutong-citybus-001": ["ZK6890HG", "ZK6126HG", "ZK6186HG"],
  "yutong-coach-001": ["T12", "C12PRO", "D14", "T14", "C11 (ZK6117H)", "C13PRO", "C9 (ZK6907H)", "T7", "ZK6126D"],
  "yutong-airfield-001": ["AB14", "AB14E"],
  "yutong-special-001": ["BC12", "PT9", "PC9", "ASCLE", "AKESO", "MC6", "PV9", "RV9", "AKESO5"],
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
