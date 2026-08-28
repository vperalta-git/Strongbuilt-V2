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
npm run build
```

The catalog automatically uses typed mock data when MongoDB is not configured. The entire public site remains browsable without environment variables.

## Environment variables

Copy `.env.example` to `.env.local` and provide only the integrations in use.

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical base URL, sitemap, and structured data |
| `MONGODB_URI` | Optional locally | MongoDB Atlas connection string |
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

Set `NEXT_PUBLIC_SITE_URL` to the final production domain. The website and mock catalog work without additional variables; inquiry delivery requires MongoDB, EmailJS, or both. Add any production variables through Vercel Project Settings rather than committing them.

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

- `lib/data/mock-trucks.ts` is the local seed/mock catalog.
- `lib/data/trucks.ts` reads active products from MongoDB when configured. Typed mock data is used when no MongoDB URI is supplied; production database failures or an intentionally empty collection do not republish demo products.
- Product images are URL/path references with optional provider metadata. Base64 image payloads are not stored in ordinary product documents.
- `config/site.ts` is the single source for contact details, navigation, and company naming.
- `POST /api/inquiries` validates quote/contact requests and persists them when MongoDB is configured.
- `GET /api/trucks` exposes the active public catalog for future clients and supports `brand`, `type`, and `featured=true` filters.

MongoDB collection names are reserved in `lib/db/collections.ts` for:

- `products`
- `brands`
- `categories`
- `industries`
- `inquiries`
- `siteSettings`

Only products and inquiries need live persistence in this public-first phase. The other collections are represented by typed content modules until the admin dashboard is built.

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
2. CRUD for products, brands, categories, industries, services, homepage content, site settings, and SEO fields.
3. Media uploads through Cloudinary, Vercel Blob, GridFS, or another selected provider using the existing media-reference shape.
4. Inquiry inbox with statuses, notes, assignment/export, and retention controls.
5. Brochure upload/attachment and product display ordering.
6. Draft/preview/publish workflow and validation before public content becomes active.
7. A seed/import command to move the typed reference catalog into MongoDB after product owners approve it.

Complex roles, CRM, financing, live availability, customer accounts, and quotation-document generation remain intentionally outside this public website phase.
