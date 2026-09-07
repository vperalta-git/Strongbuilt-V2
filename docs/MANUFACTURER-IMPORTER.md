# Manufacturer import pipeline

The importer reads manufacturer-owned JSON from `data/imports/raw/{manufacturer}/`, passes each record through that manufacturer's adapter, validates the canonical Vehicle result, resolves MongoDB relationships at runtime, checks collisions, and produces machine-readable reports under `data/imports/reports/{manufacturer}/`.

Supported registry keys are `isuzu`, `faw`, `forland`, `shacman`, `asiastar`, `sinotruk`, and `yutong`. ISUZU has a source-specific adapter. The other adapters deliberately accept canonical import records only until their manufacturer source contracts are reviewed; missing source files or unknown shapes fail closed.

## Commands

```powershell
# Validate all source records (read-only)
npm run validate:manufacturer -- isuzu

# Validate selected models (read-only)
npm run validate:manufacturer -- isuzu --models NMR85HS,NPR85K

# Build a promotion plan; dry run is the default
npm run promote:manufacturer -- isuzu

# Future explicit apply (do not use without production approval)
npm run promote:manufacturer -- isuzu --apply
```

An apply is insert-only. Existing equivalent vehicles are classified as `ALREADY_EXISTS`; conflicting identities are errors. No existing vehicle is silently updated, no brand or truck type is created, and all eligible inserts occur in one MongoDB transaction. Documents are BSON-round-tripped with undefined values omitted before they become eligible.

## Reports

- `validation.json` — record and batch validation, relationship resolution, collisions, and data-safety fingerprints.
- `promotion-plan.json` — expected inserts, updates (always zero), deletes (always zero), and transaction eligibility.
- `image-plan.json` — source provenance, suggested local paths, and local migration status. It does not download assets.

The original `trucks`, `truckTypes`, `/api/trucks`, `/trucks`, `/trucks/[slug]`, and quote `selectedTruck.truckId` contracts remain unchanged. Manufacturer imports are outside the original 12-slug seed ownership set.
