# Vehicle Migration Foundation

Strongbuilt uses `Vehicle` as the canonical internal domain while preserving the existing public and MongoDB compatibility contracts.

## Compatibility boundaries

These names intentionally remain unchanged during this phase:

- MongoDB collections: `trucks` and `truckTypes`
- Public routes: `/trucks` and `/trucks/[slug]`
- Public API: `/api/trucks`
- Quote snapshot reference: `selectedTruck.truckId`
- Static fallback: `lib/data/mock-trucks.ts`

The runtime flow is:

```text
MongoDB trucks documents
  -> per-document validation and isolation
  -> canonical Vehicle domain
  -> Vehicle-to-legacy-Truck adapter
  -> existing public components and routes
```

A malformed vehicle is skipped without replacing valid MongoDB results. The static catalog is used only when MongoDB is not configured or the catalog query fails as a whole.

## Canonical taxonomy

The domain separates:

- `vehicleFamily`
- `bodyType`
- `dutyClass`
- `propulsion`
- `applicationTags`

Taxonomy values are centrally defined in `lib/domain/vehicle-taxonomy.ts`. Adding an approved value requires a code and validation update but no MongoDB schema migration.

The current `truckTypes` documents may temporarily hold expanded type slugs plus canonical `vehicleFamily` and `canonicalBodyType` values. Existing `_id` values and current truck `typeId` references remain stable.

The eventual `vehicleTypes` migration should be additive:

1. Create `vehicleTypes` only after the expanded taxonomy is approved.
2. Copy approved `truckTypes` documents while preserving their `_id` values.
3. Add dual-read validation and compare resolved type labels.
4. Switch the repository helper after reference verification.
5. Retain `truckTypes` until all public, quote, seed, and admin paths have been verified.

No collection rename or copy is part of the current foundation.

## Import staging

`lib/imports/normalize-vehicle.ts` is a pure validation pipeline. It does not import a collection helper and cannot write to live `trucks`.

```text
raw manufacturer records
  -> source-shape validation
  -> brand-slug validation
  -> taxonomy normalization
  -> numeric and media validation
  -> slug and likely-model duplicate detection
  -> configuration conflict detection
  -> QA report
  -> later human approval and promotion
```

Each staged result retains:

- the original raw value
- a normalized candidate, when valid
- normalization decisions with reasons
- warning and error issues
- `ready`, `needs-review`, or `rejected` status

The controlled promotion boundary is now explicit: `npm run promote:isuzu` is a zero-write dry run, while `npm run promote:isuzu -- --apply` is the only apply path. Apply mode is insert-only, limited to the reviewed eight-model batch, and uses one MongoDB transaction so any validation or identity conflict aborts the batch. It is not connected to build, seed, or deployment automation.

## Source fidelity and media

Imported candidates require manufacturer provenance, a product URL, and a verification timestamp. Alternate URLs, data warnings, raw configuration values, and normalization decisions remain available for QA.

Images support source URLs/pages, provider, status, primary selection, and ordering. External manufacturer domains are not enabled in `next.config.ts`. A later media decision should prefer Strongbuilt-controlled storage.

The canonical `brochure` object adds title and source metadata while `brochureUrl` remains supported by the legacy public adapter.

## Quote compatibility

`selectedTruck.truckId` is an intentional legacy field. New snapshots continue to use it even though the internal record is a `Vehicle`. Existing inquiry and quote documents are not rewritten by this architecture.

## Seed and future admin ownership

The current seed remains a code-owned reference synchronization and continues to upsert the verified 12-record catalog. It does not delete operational data.

Before an admin becomes authoritative, seed ownership must be split:

- system/reference seed: indexes, required settings, immutable reference values
- editable catalog: admin-owned records that deployment builds do not overwrite

Automatic production seeding must be narrowed or disabled for admin-owned catalog fields before the admin dashboard is launched.

## Executable validation

Run:

```bash
npm run validate:vehicles
```

This verifies the legacy adapter, current 12 records, MongoDB invalid-record isolation, taxonomy aliases, brand-slug resolution, staging QA, slug collisions, and legacy quote `truckId` compatibility without connecting to or writing MongoDB.
