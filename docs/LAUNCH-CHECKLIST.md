# Strongbuilt V2 launch checklist

## Company confirmation

- Confirm legal display name, telephone, sales email, Pasig address, and business hours.
- Replace the current repository-sourced logo files with the final official exports if newer artwork is supplied.
- Confirm active vehicle brands, models, configurations, and specifications.
- Approve all public-facing About, Services, and Industries copy.

## Integrations

- Configure MongoDB Atlas and verify `products` and `inquiries` access from Vercel.
- Configure EmailJS template fields and run an end-to-end inquiry test.
- Add an approved map embed URL.
- Add confirmed social URLs.
- Add brochure URLs or uploaded brochure assets.

## Legal and operations

- Replace the interim privacy notice with company-approved language.
- Define inquiry retention and deletion rules.
- Confirm who receives and follows up on quote requests.
- Confirm product availability language and internal specification approval.

## Final quality pass

- Test navigation, filters, gallery, contact, and quote submission on physical mobile devices.
- Validate hero image crops after final photography is supplied.
- Run `npm run lint`, `npm run typecheck`, and `npm run build`.
- Run accessibility and Lighthouse checks against the production deployment.
- Submit `/sitemap.xml` after the final production domain is connected.
