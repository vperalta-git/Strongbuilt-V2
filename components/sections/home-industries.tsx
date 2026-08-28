import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { industries } from "@/lib/data/industries"
import { Container } from "@/components/ui/container"
import { ButtonLink } from "@/components/ui/button-link"
import { SectionHeading } from "@/components/ui/section-heading"

export function HomeIndustries() {
  const lead = industries[0]

  return (
    <section className="bg-paper py-20 sm:py-28 lg:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Industries"
              title={<>Vehicles shaped by <span className="text-brand">how business moves.</span></>}
              copy="The same truck can be right for one operation and wrong for another. Application gives the specification its meaning."
            />
            <div className="relative mt-12 aspect-[4/3] overflow-hidden bg-ink">
              <Image src={lead.image.url} alt={lead.image.alt} fill sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-brand">{lead.eyebrow}</p>
                <p className="mt-2 font-display text-4xl font-bold uppercase leading-none">{lead.name}</p>
              </div>
            </div>
          </div>

          <div className="lg:pt-14">
            <div className="border-t border-line">
              {industries.map((industry, index) => (
                <Link
                  key={industry.slug}
                  href={`/industries#${industry.slug}`}
                  className="group grid gap-4 border-b border-line py-6 transition-colors hover:border-brand sm:grid-cols-[48px_0.75fr_1fr_48px] sm:items-center sm:gap-6 lg:py-8"
                >
                  <span className="text-[10px] font-extrabold tracking-[0.16em] text-muted">0{index + 1}</span>
                  <h3 className="font-display text-3xl font-bold uppercase leading-none transition-colors group-hover:text-brand lg:text-4xl">{industry.name}</h3>
                  <p className="text-sm leading-6 text-muted">{industry.summary}</p>
                  <span className="hidden h-11 w-11 place-items-center border border-line transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-white sm:grid">
                    <ArrowRight aria-hidden="true" className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
            <ButtonLink href="/industries" variant="outline-dark" className="mt-8">Explore industries</ButtonLink>
          </div>
        </div>
      </Container>
    </section>
  )
}
