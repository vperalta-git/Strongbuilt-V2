export const asiastarReviewedBatches = {
  "asiastar-coach-001": [
    "YBL6128HQ1",
    "YBL6130H",
    "YBL6148H",
    "YBL6125H",
  ],
  "asiastar-intercity-001": [
    "YBL6859H",
    "YBL6140T",
    "YBL6130T",
    "YBL6129T",
    "YBL6121H",
    "JS6890G",
    "JS6840G",
    "JS6762G",
    "YBL6129H",
    "YBL6829H",
    "YBL6909H",
    "JS6840GJ Front Engine Bus",
    "YBL6909HQ",
  ],
  "asiastar-citybus-001": [
    "JS6860GHN NG City Bus",
    "JS6960GHCP Natural Gas City Bus",
    "JS6128",
    "JS6108",
    "JS6181GHBEV",
    "JS6120GHBEV",
    "JS6128GH / JS6128GHP",
    "JS6108GHA / JS6108GHP",
    "JS6851GH / JS6851GHP",
    "JS6926GHCP",
    "JS6600G / JS6600GP",
  ],
} as const

export const asiastarExcludedProductionDuplicates = ["YBL6119H"] as const

export const asiastarVariantReviewRequired = [
  "YBL6128H (X9-3)",
  "YBL6128H",
] as const

export const asiastarPromotionModels = Object.values(asiastarReviewedBatches).flat()
