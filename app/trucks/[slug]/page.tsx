import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Check, Download, FileText, Mail, Phone } from "lucide-react"
import { TruckGallery } from "@/components/trucks/truck-gallery"
import { TruckCard } from "@/components/trucks/truck-card"
import { Container } from "@/components/ui/container"
import { ButtonLink } from "@/components/ui/button-link"
import { absoluteUrl, siteConfig } from "@/config/site"
import { getRelatedTrucks, getTruckBySlug, getTrucks } from "@/lib/data/trucks"

export const revalidate = 300

type TruckPageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const trucks = await getTrucks()
  return trucks.map((truck) => ({ slug: truck.slug }))
}

export async function generateMetadata({ params }: TruckPageProps): Promise<Metadata> {
  const { slug } = await params
  const truck = await getTruckBySlug(slug)
  if (!truck) return { title: "Truck not found" }
  const title = truck.seo?.title || `${truck.brand} ${truck.model}`
  const description = truck.seo?.description || truck.shortDescription
  const image = truck.seo?.image || truck.images[0]?.url

  return {
    title,
    description,
    alternates: { canonical: `/trucks/${truck.slug}` },
    openGraph: {
      type: "website",
      title: `${title} | Strongbuilt`,
      description,
      url: `/trucks/${truck.slug}`,
      images: image ? [{ url: image, alt: truck.images[0]?.alt || title }] : undefined,
    },
  }
}

export default async function TruckDetailPage({ params }: TruckPageProps) {
  const { slug } = await params
  const truck = await getTruckBySlug(slug)
  if (!truck) notFound()

  const related = await getRelatedTrucks(truck, 3)
  const groups = ["Powertrain", "Dimensions & capacity", "Chassis & running gear", "Equipment"] as const
  const featuredSpecs = truck.specifications.filter((spec) => spec.featured).slice(0, 4)
  const [modelLead, ...modelDetailParts] = truck.model.split(" ")
  const modelDetail = modelDetailParts.join(" ")

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${truck.brand} ${truck.model}`,
    description: truck.description,
    image: truck.images.map((image) => absoluteUrl(image.url)),
    category: `${truck.category} ${truck.bodyType}`,
    brand: { "@type": "Brand", name: truck.brand },
    url: absoluteUrl(`/trucks/${truck.slug}`),
  }

  return (
    <>
      <section className="relative overflow-hidden bg-ink pb-8 pt-36 text-white sm:pt-44 lg:pt-48">
        <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-45" />
        <Container>
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-white/68">
            <Link href="/" className="hover:text-white">Home</Link><span>/</span>
            <Link href="/trucks" className="hover:text-white">Trucks</Link><span>/</span>
            <span aria-current="page" className="text-brand">{truck.model}</span>
          </nav>
        </Container>
      </section>

      <section className="relative overflow-hidden bg-ink pb-20 text-white lg:pb-28">
        <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-45" />
        <div aria-hidden="true" className="absolute -right-10 top-0 font-display text-[18rem] font-black uppercase leading-none tracking-[-0.06em] text-white/[0.025]">{truck.brand}</div>
        <Container className="relative">
          <div className="grid border border-white/14 bg-ink-soft lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <div className="border-b border-white/14 p-4 sm:p-7 lg:flex lg:items-center lg:border-b-0 lg:border-r lg:p-8 xl:p-9">
              <TruckGallery images={truck.images} />
            </div>

            <div className="flex min-w-0 flex-col p-6 sm:p-9 lg:p-10 xl:p-12">
              <div className="flex flex-wrap items-center gap-2.5 text-[10px] font-extrabold uppercase tracking-[0.15em]">
                <span className="bg-brand px-3.5 py-2 text-ink">{truck.brand}</span>
                <span className="border border-white/20 px-3.5 py-2 text-white/68">{truck.bodyType}</span>
                <span className="border border-white/20 px-3.5 py-2 text-white/68">{truck.category}</span>
              </div>
              <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand">Commercial work platform</p>
              <h1 className="mt-4 max-w-full font-display text-[clamp(3.5rem,6.6vw,7rem)] font-black uppercase leading-[0.86] tracking-[-0.035em] text-white [overflow-wrap:anywhere]">{modelLead}</h1>
              {modelDetail ? <p className="mt-4 max-w-xl font-display text-[clamp(1.5rem,2.5vw,2rem)] font-bold uppercase leading-[1.08] tracking-[0.01em] text-white/76">{modelDetail}</p> : null}
              <p className="mt-6 max-w-[42rem] text-base leading-7 text-white/68 sm:text-lg sm:leading-8">{truck.shortDescription}</p>

              {featuredSpecs.length ? (
                <dl className="mt-8 grid grid-cols-2 border-l border-t border-white/14">
                  {featuredSpecs.map((spec) => (
                    <div key={spec.label} className="border-b border-r border-white/14 p-4">
                      <dt className="text-[9px] font-extrabold uppercase tracking-[0.13em] text-white/68">{spec.label}</dt>
                      <dd className="mt-2 font-display text-xl font-bold leading-5 text-white">{spec.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <div className="mt-9 grid gap-3 sm:grid-cols-2">
                <ButtonLink href={`/request-a-quote?truck=${encodeURIComponent(truck.slug)}`} size="lg">Request a quote</ButtonLink>
                <a href={`tel:${siteConfig.contact.phoneHref}`} className="inline-flex min-h-14 items-center justify-center gap-3 border border-white/50 px-6 text-sm font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:border-white hover:bg-white hover:text-ink">
                  <Phone aria-hidden="true" className="h-4 w-4" /> Contact sales
                </a>
              </div>
              <p className="mt-3 max-w-xl text-xs leading-5 text-white/68">Specifications and configuration availability are subject to sales confirmation.</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-sail py-20 sm:py-24 lg:py-28">
        <Container>
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Vehicle overview</p>
              <h2 className="mt-5 font-display text-5xl font-bold uppercase leading-[0.88] sm:text-7xl">Configured for commercial work.</h2>
            </div>
            <div>
              <p className="text-lg leading-8 text-ink">{truck.description}</p>
              <div className="mt-10 grid gap-10 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink">Applications</h3>
                  <ul className="mt-5 space-y-3">
                    {truck.applications.map((application) => (
                      <li key={application} className="flex gap-3 text-sm text-muted"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{application}</li>
                    ))}
                  </ul>
                </div>
                {truck.configurations?.length ? (
                  <div>
                    <h3 className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink">Documented configurations</h3>
                    <ul className="mt-5 space-y-3">
                      {truck.configurations.map((configuration) => (
                        <li key={configuration} className="flex gap-3 text-sm text-muted"><Check aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />{configuration}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-paper py-20 sm:py-24 lg:py-28">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[0.45fr_1fr] lg:gap-20">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Specifications</p>
              <h2 className="mt-5 font-display text-5xl font-bold uppercase leading-[0.88] sm:text-7xl">Useful details, clearly grouped.</h2>
              <p className="mt-6 text-sm leading-6 text-muted">Only populated specification fields are shown. Confirm final specification with Strongbuilt before ordering.</p>
            </div>
            <div className="border-t border-line">
              {groups.map((group, index) => {
                const specs = truck.specifications.filter((spec) => spec.group === group)
                if (!specs.length) return null
                return (
                  <details key={group} open={index === 0} className="group border-b border-line">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-6 font-display text-3xl font-bold uppercase marker:content-none">
                      {group}<span className="text-2xl font-normal text-brand transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <dl className="pb-7">
                      {specs.map((spec) => (
                        <div key={spec.label} className="grid gap-1 border-t border-line/70 py-4 sm:grid-cols-[0.42fr_0.58fr] sm:gap-6">
                          <dt className="text-xs font-extrabold uppercase tracking-[0.1em] text-muted">{spec.label}</dt>
                          <dd className="text-sm font-semibold leading-6 text-ink">{spec.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )
              })}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-ink py-16 text-white sm:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Documents & next steps</p>
              <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-none sm:text-6xl">Need the complete vehicle brief?</h2>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/60">Request the current brochure, configuration confirmation, and quotation directly from the Strongbuilt sales team.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              {truck.brochureUrl ? (
                <a href={truck.brochureUrl} className="inline-flex min-h-13 items-center justify-center gap-3 bg-white px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-ink"><Download aria-hidden="true" className="h-4 w-4" />Download brochure</a>
              ) : (
                <Link href={`/request-a-quote?truck=${encodeURIComponent(truck.slug)}`} className="inline-flex min-h-13 items-center justify-center gap-3 bg-white px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-ink transition-colors hover:bg-brand hover:text-ink"><FileText aria-hidden="true" className="h-4 w-4" />Request brochure</Link>
              )}
              <a href={`mailto:${siteConfig.contact.email}?subject=${encodeURIComponent(`${truck.brand} ${truck.model} inquiry`)}`} className="inline-flex min-h-13 items-center justify-center gap-3 border border-white/50 px-5 text-xs font-extrabold uppercase tracking-[0.12em] text-white hover:border-brand hover:text-brand"><Mail aria-hidden="true" className="h-4 w-4" />Email sales</a>
            </div>
          </div>
        </Container>
      </section>

      {related.length ? (
        <section className="bg-paper py-20 sm:py-24 lg:py-28">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-6">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Continue exploring</p>
                <h2 className="mt-4 font-display text-5xl font-bold uppercase leading-none sm:text-7xl">Related trucks</h2>
              </div>
              <Link href="/trucks" className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] hover:text-brand"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to catalog</Link>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => <TruckCard key={item.slug} truck={item} />)}
            </div>
          </Container>
        </section>
      ) : null}

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, "\\u003c") }} />
    </>
  )
}
