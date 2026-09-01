import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, FileText } from "lucide-react"
import type { Truck } from "@/types/truck"
import { Container } from "@/components/ui/container"
import { ButtonLink } from "@/components/ui/button-link"
import { SectionHeading } from "@/components/ui/section-heading"

export function FeaturedTrucks({ trucks }: { trucks: Truck[] }) {
  const [lead, ...supporting] = trucks.slice(0, 4)
  if (!lead) return null
  const leadImage = lead.images[0]
  const leadSpecs = lead.specifications.filter((spec) => spec.featured).slice(0, 4)

  return (
    <section className="bg-sail py-20 sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <SectionHeading
            eyebrow="Featured commercial vehicles"
            title={<>Start with a proven <span className="text-brand">platform.</span></>}
            copy="Explore a selected range of actual catalog units, then talk with the team about body, application, and fleet requirements."
          />
          <ButtonLink href="/trucks" variant="outline-dark" className="w-fit">View full catalog</ButtonLink>
        </div>

        <div className="mt-14 grid border border-line bg-paper lg:grid-cols-[1.2fr_0.8fr]">
          <Link href={`/trucks/${lead.slug}`} className="group relative min-h-[390px] overflow-hidden border-b border-line bg-ink lg:min-h-[650px] lg:border-b-0 lg:border-r" aria-label={`View ${lead.brand} ${lead.model}`}>
            <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-70" />
            <div aria-hidden="true" className="absolute bottom-0 right-0 h-[55%] w-[60%] bg-brand [clip-path:polygon(45%_0,100%_0,100%_100%,0_100%)] opacity-20" />
            {leadImage ? (
              <Image
                src={leadImage.url}
                alt={leadImage.alt}
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-contain p-8 pb-16 drop-shadow-[0_30px_34px_rgba(0,0,0,0.42)] transition-transform duration-700 group-hover:-translate-y-1 group-hover:translate-x-1 lg:p-14"
              />
            ) : null}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/90 via-black/65 to-transparent px-6 pb-6 pt-24 text-white sm:px-8 sm:pb-8">
              <span className="text-xs font-extrabold uppercase tracking-[0.16em]">View vehicle</span>
              <span className="grid h-11 w-11 place-items-center border border-white/45 transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-ink"><ArrowUpRight aria-hidden="true" className="h-5 w-5" /></span>
            </div>
          </Link>

          <div className="flex flex-col p-6 sm:p-9 lg:p-12">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">{lead.brand} / {lead.bodyType}</p>
            <h3 className="mt-4 font-display text-5xl font-black uppercase leading-[0.84] tracking-[-0.035em] sm:text-6xl">{lead.model}</h3>
            <p className="mt-6 text-base leading-7 text-muted">{lead.shortDescription}</p>
            <dl className="mt-8 grid grid-cols-2 border-l border-t border-line">
              {leadSpecs.map((spec) => (
                <div key={spec.label} className="border-b border-r border-line p-4 sm:p-5">
                  <dt className="text-[9px] font-extrabold uppercase tracking-[0.15em] text-muted">{spec.label}</dt>
                  <dd className="mt-2 text-sm font-bold leading-5 text-ink">{spec.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-auto lg:pt-8">
              <ButtonLink href={`/trucks/${lead.slug}`} variant="dark">View details</ButtonLink>
              <ButtonLink href={`/request-a-quote?truck=${encodeURIComponent(lead.slug)}`} variant="outline-dark">Request quote</ButtonLink>
            </div>
          </div>
        </div>

        <div className="mt-px divide-y divide-line border border-line bg-paper">
          {supporting.map((truck) => {
            const image = truck.images[0]
            const featuredSpec = truck.specifications.find((spec) => spec.featured)
            return (
              <article key={truck.slug} className="group grid items-center gap-5 p-5 transition-colors hover:bg-white sm:grid-cols-[90px_1fr_auto] sm:p-6 lg:grid-cols-[120px_0.75fr_1fr_auto] lg:gap-8">
                <Link href={`/trucks/${truck.slug}`} className="relative aspect-[4/3] overflow-hidden bg-sail" tabIndex={-1} aria-hidden="true">
                  {image ? <Image src={image.url} alt="" fill sizes="120px" className="object-contain p-2 transition-transform group-hover:scale-105" /> : null}
                </Link>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-brand">{truck.brand}</p>
                  <h3 className="mt-1 font-display text-2xl font-bold uppercase leading-none sm:text-3xl">
                    <Link href={`/trucks/${truck.slug}`} className="hover:text-brand">{truck.model}</Link>
                  </h3>
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted">{truck.bodyType}{featuredSpec ? ` / ${featuredSpec.value}` : ""}</p>
                  <p className="mt-2 line-clamp-1 text-sm text-muted">{truck.shortDescription}</p>
                </div>
                <div className="flex items-center gap-2 sm:justify-end">
                  <Link href={`/request-a-quote?truck=${encodeURIComponent(truck.slug)}`} className="grid h-11 w-11 place-items-center border border-line transition-colors hover:border-brand hover:bg-brand hover:text-ink" aria-label={`Request a quote for ${truck.model}`}><FileText aria-hidden="true" className="h-4 w-4" /></Link>
                  <Link href={`/trucks/${truck.slug}`} className="grid h-11 w-11 place-items-center bg-ink text-white transition-colors hover:bg-brand hover:text-ink" aria-label={`View ${truck.model}`}><ArrowRight aria-hidden="true" className="h-4 w-4 text-current" /></Link>
                </div>
              </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
