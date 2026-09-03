# Strongbuilt V2

Production-oriented public website for Strongbuilt Motors and Equipment Inc., rebuilt from scratch with a new industrial/automotive design system and a data architecture that can support a future admin dashboard.

## Stack

- Next.js 16 App Router
- React 19 and strict TypeScript
- Tailwind CSS 4 with centralized CSS design tokens
- Official MongoDB Node.js driver
- Zod inquiry validation
- Optional EmailJS delivery

## Run locally

```bash
npm install
npm run dev
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm run validate:vehicles
npm run validate:isuzu
npm run build
```

The catalog automatically uses typed mock data when MongoDB is not configured. The entire public site remains browsable without environment variables.

## Environment variables

Copy `.env.example` to `.env.local` and provide only the integrations in use.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical base URL, sitemap, and structured data |
| `MONGODB_URI` | Required for database features | MongoDB Atlas connection string |
| `MONGODB_DB` | Optional | Database name; defaults to `strongbuilt` |
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | Optional | EmailJS service identifier |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | Optional | EmailJS inquiry template identifier |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | Optional | EmailJS public browser key |
| `NEXT_PUBLIC_MAP_EMBED_URL` | Optional | Approved map embed URL for the Contact page |

Do not commit `.env.local` or MongoDB credentials. EmailJS private keys are not used in the browser.

## Deploy to Vercel

Import `vperalta-git/Strongbuilt-V2` into Vercel or deploy it with the Vercel CLI. The project uses the standard Next.js preset with these settings:

- Node.js: 22.x
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: managed automatically by Next.js

Set `NEXT_PUBLIC_SITE_URL` to the final production domain. The website and mock catalog work without database variables; inquiry persistence requires MongoDB. Add production variables through Vercel Project Settings rather than committing them. After setting `MONGODB_URI` and `MONGODB_DB`, redeploy and verify `/api/health/database` returns `connected: true`.

## Database setup

1. Copy `.env.example` to `.env.local`.
2. Add the MongoDB Atlas connection string to `MONGODB_URI`.
3. Keep `MONGODB_DB=strongbuilt`.
4. Install dependencies and run the seed:

```bash
npm install
npm run seed
```

The seed validates the current verified Strongbuilt data, creates required indexes, and upserts records by slug. It is safe to run repeatedly and never drops collections or deletes inquiry and quotation records. After seeding, start the application normally with `npm run dev` or build it with `npm run build`.

Production deployments run this same idempotent synchronization before Next.js generates the site. Non-production builds skip automatic seeding, and `npm run seed` remains the explicit command for local or maintenance runs.

Every push to `main` will create a production deployment once the GitHub repository is connected to the Vercel project. Pull requests and other branches create preview deployments.

## Architecture

```text
app/                    Public routes, metadata, sitemap, robots, and API handlers
components/layout/      Responsive navigation and footer
components/sections/    Editorial page and homepage sections
components/trucks/      Catalog filtering, cards, and product gallery
components/forms/       Public contact and quotation flow
components/ui/          Small reusable visual primitives
config/                 Centralized company/site settings
lib/data/               Mock catalog plus Mongo-backed repositories and editable content
lib/db/                 Cached MongoDB connection and collection names
lib/validation/         Shared Zod request validation
types/                  Public data contracts
public/images/          Replaceable brand, truck, industry, and editorial assets
```

Important data boundaries:

- `lib/data/mock-trucks.ts` is the verified source for the initial commercial vehicle seed.
- `lib/data/trucks.ts` reads active trucks from the normalized MongoDB collections when seeded and falls back to the verified local catalog if MongoDB is unavailable or has no active trucks.
- Product images are URL/path references with optional provider metadata. Base64 image payloads are not stored in ordinary product documents.
- `config/site.ts` is the single source for contact details, navigation, and company naming.
- `POST /api/inquiries` validates quote/contact requests and persists them when MongoDB is configured.
- `GET /api/trucks` exposes the active public catalog for future clients and supports `brand`, `type`, and `featured=true` filters.

MongoDB collection names and typed helpers are defined in `lib/db/collections.ts` for:

- `brands`
- `truckTypes`
- `trucks`
- `industries`
- `services`
- `siteSettings`
- `inquiries`
- `quoteRequests`

The idempotent seed synchronizes catalog and public content records while preserving all existing inquiry and quote-request documents. New contact submissions are stored in `inquiries`; new quotation submissions are stored in `quoteRequests` with a selected-truck snapshot when a catalog vehicle can be resolved.

The canonical internal catalog domain is now `Vehicle`, while the MongoDB `trucks`/`truckTypes` collections, `/trucks` routes, `/api/trucks`, and quote `selectedTruck.truckId` field remain intentional compatibility contracts. Manufacturer imports must pass the non-writing staging and QA pipeline before any later promotion step. See `docs/VEHICLE-MIGRATION-FOUNDATION.md`.

`npm run validate:isuzu` validates only the approved eight-model N-Series test batch. It reads MongoDB solely for brand resolution, duplicate checks, collection counts, and catalog verification; it never writes or promotes staged vehicles. The machine-readable result is generated at `data/imports/reports/isuzu-n-series-test.json`.

## Content and asset accuracy

The V2 catalog and business contact information were derived from the existing Strongbuilt repository supplied in the project brief. Public pricing is intentionally absent everywhere, including structured data and APIs.

Before production launch, confirm or replace:

- `public/images/brand/strongbuilt-logo.png` and `strongbuilt-logo-light.png` with the final supplied official exports.
- Current product availability and every technical specification with Strongbuilt sales/product owners.
- Product galleries; current reference catalog entries generally provide one image per vehicle.
- Final downloadable brochures and each `brochureUrl`.
- EmailJS and MongoDB Atlas environment configuration.
- Approved map embed URL.
- Facebook, Messenger, LinkedIn, and other social URLs; no links are fabricated in the current footer.
- Final privacy policy and legal review of inquiry retention language.

## Next phase: admin dashboard

The next phase should add a protected `/admin` area without changing public route contracts:

1. Single-admin authentication with secure server-side sessions and audit timestamps.
2. CRUD for trucks, brands, truck types, industries, services, homepage content, site settings, and SEO fields.
3. Media uploads through Cloudinary, Vercel Blob, GridFS, or another selected provider using the existing media-reference shape.
4. Inquiry inbox with statuses, notes, assignment/export, and retention controls.
5. Brochure upload/attachment and product display ordering.
6. Draft/preview/publish workflow and validation before public content becomes active.
7. A seed/import command to move the typed reference catalog into MongoDB after product owners approve it.

Complex roles, CRM, financing, live availability, customer accounts, and quotation-document generation remain intentionally outside this public website phase.
