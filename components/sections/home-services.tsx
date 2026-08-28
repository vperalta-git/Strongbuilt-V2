import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { services } from "@/lib/data/services"
import { Container } from "@/components/ui/container"
import { SectionHeading } from "@/components/ui/section-heading"

export function HomeServices() {
  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-28 lg:py-36">
      <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-50" />
      <Container className="relative">
        <div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-20">
          <div className="lg:sticky lg:top-36 lg:self-start">
            <SectionHeading
              eyebrow="What Strongbuilt provides"
              theme="dark"
              title={<>From requirement to <span className="text-brand">working configuration.</span></>}
              copy="A practical sales process for teams that need more than a model name and brochure."
            />
          </div>

          <div className="border-t border-white/15">
            {services.map((service) => (
              <Link key={service.slug} href={`/services#${service.slug}`} className="group grid gap-4 border-b border-white/15 py-7 transition-colors hover:border-brand sm:grid-cols-[52px_0.75fr_1fr_40px] sm:items-start sm:gap-6 lg:py-9">
                <span className="text-xs font-extrabold tracking-[0.15em] text-brand">{service.number}</span>
                <h3 className="font-display text-3xl font-bold uppercase leading-[0.95] transition-colors group-hover:text-brand sm:text-4xl">{service.title}</h3>
                <p className="text-sm leading-6 text-white/58">{service.summary}</p>
                <ArrowUpRight aria-hidden="true" className="hidden h-5 w-5 text-white/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand sm:block" />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
