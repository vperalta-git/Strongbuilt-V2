"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { useState } from "react"
import { industries } from "@/lib/data/industries"
import { Container } from "@/components/ui/container"

export function HomeIndustries() {
  const [active, setActive] = useState(0)
  const selected = industries[active]

  return (
    <section className="bg-paper py-20 sm:py-28 lg:py-36">
      <Container>
        <div className="grid gap-8 border-b border-line pb-10 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand">Industries</p>
            <h2 className="mt-5 max-w-4xl font-display text-[clamp(3.4rem,7vw,7.2rem)] font-black uppercase leading-[0.82] tracking-[-0.04em] text-ink">
              Built around how <span className="text-brand">business moves.</span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-muted lg:justify-self-end">
            Application gives every specification its meaning. Select an operating sector to see the work, body types, and commercial context together.
          </p>
        </div>

        <div className="mt-12 hidden min-h-[610px] grid-cols-[0.72fr_1.28fr] border-y border-line lg:grid">
          <div className="divide-y divide-line border-r border-line pr-8 xl:pr-12">
            {industries.map((industry, index) => (
              <button
                key={industry.slug}
                type="button"
                aria-pressed={active === index}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className={`group grid min-h-[101px] w-full grid-cols-[42px_1fr_auto] items-center gap-4 text-left transition-colors ${active === index ? "text-brand" : "text-ink hover:text-brand"}`}
              >
                <span className="text-[10px] font-extrabold tracking-[0.16em] text-muted">0{index + 1}</span>
                <span className="font-display text-3xl font-black uppercase leading-none tracking-[-0.02em] xl:text-4xl">{industry.name}</span>
                <ArrowRight aria-hidden="true" className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${active === index ? "translate-x-1 text-brand" : "text-ink/25"}`} />
              </button>
            ))}
          </div>

          <article className="grid grid-rows-[1fr_auto] bg-sail">
            <div className="relative min-h-[390px] overflow-hidden bg-ink">
              <Image key={selected.image.url} src={selected.image.url} alt={selected.image.alt} fill sizes="(min-width: 1024px) 58vw, 100vw" className="animate-hero-image object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/82 via-transparent to-transparent" />
              <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between gap-8 xl:bottom-9 xl:left-9 xl:right-9">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">{selected.eyebrow}</p>
                  <h3 className="mt-2 font-display text-5xl font-black uppercase leading-none tracking-[-0.03em] text-white xl:text-6xl">{selected.name}</h3>
                </div>
                <span className="font-display text-6xl font-black text-white/18">{String(active + 1).padStart(2, "0")}</span>
              </div>
            </div>
            <div className="grid gap-7 border-t border-line p-7 xl:grid-cols-[1fr_0.78fr_auto] xl:items-end xl:p-9">
              <p className="text-base font-semibold leading-7 text-ink">{selected.summary}</p>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted">Relevant body types</p>
                <p className="mt-2 text-sm leading-6 text-muted">{selected.recommendedBodyTypes.join(" / ")}</p>
              </div>
              <Link href={`/industries#${selected.slug}`} className="cut-corner grid h-14 w-14 place-items-center bg-ink text-white transition-colors hover:bg-brand" aria-label={`Explore ${selected.name}`}>
                <ArrowUpRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
          </article>
        </div>

        <div className="mt-10 border-t border-line lg:hidden">
          {industries.map((industry, index) => (
            <details key={industry.slug} open={index === 0} className="group border-b border-line">
              <summary className="grid min-h-20 cursor-pointer list-none grid-cols-[36px_1fr_auto] items-center gap-3 py-4 marker:content-none">
                <span className="text-[10px] font-extrabold tracking-[0.16em] text-brand">0{index + 1}</span>
                <span className="font-display text-2xl font-black uppercase leading-none tracking-[-0.02em] sm:text-3xl">{industry.name}</span>
                <span className="text-2xl font-light text-brand transition-transform group-open:rotate-45">+</span>
              </summary>
              <div className="pb-7">
                <div className="relative aspect-[16/10] overflow-hidden bg-ink">
                  <Image src={industry.image.url} alt={industry.image.alt} fill sizes="100vw" className="object-cover" />
                </div>
                <p className="mt-5 text-base font-semibold leading-7 text-ink">{industry.summary}</p>
                <p className="mt-3 text-sm leading-6 text-muted">Recommended: {industry.recommendedBodyTypes.join(" / ")}</p>
                <Link href={`/industries#${industry.slug}`} className="mt-5 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-ink hover:text-brand">
                  Explore sector <ArrowUpRight aria-hidden="true" className="h-4 w-4 text-brand" />
                </Link>
              </div>
            </details>
          ))}
        </div>

        <Link href="/industries" className="mt-8 inline-flex items-center gap-3 border-b-2 border-brand pb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-ink transition-colors hover:text-brand">
          View all industry applications <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Link>
      </Container>
    </section>
  )
}
