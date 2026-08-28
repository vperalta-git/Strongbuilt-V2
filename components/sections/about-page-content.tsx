import { ArrowRight, ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { industries } from "@/lib/data/industries"
import { services } from "@/lib/data/services"

const approach = [
  {
    number: "01",
    title: "Application before assumption",
    description: "Route, load, frequency, access, and operating environment provide the starting point for a useful vehicle brief.",
  },
  {
    number: "02",
    title: "One working configuration",
    description: "Chassis, drivetrain, body, dimensions, and equipment need to be considered as parts of the same commercial vehicle.",
  },
  {
    number: "03",
    title: "Clear commercial coordination",
    description: "Product questions, configuration details, and quote requirements are organized so buyers can evaluate the next step with context.",
  },
] as const

export function AboutPageContent() {
  return (
    <div className="overflow-hidden bg-sail text-ink">
      <section className="relative border-b border-line bg-sail pt-28 sm:pt-32">
        <div className="mx-auto grid min-h-[680px] w-full max-w-[1600px] lg:grid-cols-[0.9fr_1.1fr]">
          <div className="flex items-center px-5 py-16 sm:px-8 sm:py-20 lg:px-12 xl:px-20">
            <div className="max-w-3xl">
              <div className="mb-7 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.22em] text-brand">
                <span className="h-0.5 w-10 bg-brand" />
                About Strongbuilt
              </div>
              <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-balance sm:text-7xl xl:text-[6.2rem]">
                Commercial vehicles, considered as working tools.
              </h1>
              <p className="mt-8 max-w-2xl text-base leading-7 text-ink/65 sm:text-lg sm:leading-8">
                Strongbuilt provides commercial truck sourcing, body solutions, and fleet-focused vehicle configuration for Philippine businesses.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="/trucks"
                  className="inline-flex min-h-12 items-center gap-3 rounded-sm bg-ink px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-brand hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  Browse trucks
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center gap-3 rounded-sm border border-ink/30 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition-colors hover:border-ink hover:bg-ink hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
                >
                  Contact sales
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          <div className="relative min-h-[460px] overflow-hidden border-t border-line bg-ink lg:min-h-full lg:border-l lg:border-t-0">
            <Image
              src="/images/trucks/shacman-x3000-420.png"
              alt="Commercial tractor head documented in the Strongbuilt catalog"
              fill
              priority
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-x-0 bottom-0 bg-ink/90 px-6 py-6 text-white sm:px-8 lg:px-10">
              <div className="flex items-end justify-between gap-8">
                <div>
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-brand">Company profile</p>
                  <p className="mt-2 max-w-md font-display text-xl font-bold uppercase leading-tight sm:text-2xl">
                    {siteConfig.legalName}
                  </p>
                </div>
                <span className="hidden h-px w-24 bg-brand sm:block" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-brand text-ink">
        <div className="mx-auto grid w-full max-w-[1440px] lg:grid-cols-3">
          {[
            ["Source", "Compare suitable commercial platforms"],
            ["Configure", "Align the vehicle with the application"],
            ["Coordinate", "Carry requirements into the buying process"],
          ].map(([title, description], index) => (
            <div
              key={title}
              className="border-b border-ink/25 px-5 py-8 last:border-b-0 sm:px-8 lg:border-b-0 lg:border-r lg:px-12 lg:py-10 lg:last:border-r-0"
            >
              <div className="flex items-start gap-5">
                <span className="pt-1 text-xs font-black tracking-[0.16em]">0{index + 1}</span>
                <div>
                  <p className="font-display text-2xl font-black uppercase tracking-[-0.02em]">{title}</p>
                  <p className="mt-2 text-sm font-medium leading-6 text-ink/70">{description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-ink py-20 text-white sm:py-28">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-14 lg:px-12 xl:px-16">
          <div className="lg:col-span-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Who we are</p>
            <p className="mt-5 font-display text-3xl font-black uppercase leading-tight tracking-[-0.025em] sm:text-4xl">
              A business-focused commercial vehicle supplier.
            </p>
          </div>
          <div className="lg:col-span-7 lg:col-start-6">
            <h2 className="font-display text-4xl font-black uppercase leading-[0.98] tracking-[-0.03em] text-balance sm:text-6xl">
              The work comes first.
            </h2>
            <div className="mt-8 grid gap-6 text-base leading-8 text-white/65 sm:grid-cols-2">
              <p>
                A commercial vehicle is part of an operating system. What it carries, where it runs, how it is loaded, and how often it works all affect the right choice of platform and body.
              </p>
              <p>
                Strongbuilt helps turn those operating details into a practical sourcing and configuration brief, then coordinates the relevant vehicle and body requirements through the sales process.
              </p>
            </div>
            <Link
              href="/services"
              className="mt-9 inline-flex items-center gap-3 text-sm font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              See how we help
              <ArrowRight className="size-4 text-brand" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-paper py-20 sm:py-28">
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-7 border-b border-line pb-12 sm:pb-16 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Our approach</p>
              <h2 className="mt-4 max-w-3xl font-display text-4xl font-black uppercase leading-none tracking-[-0.03em] sm:text-6xl">
                What sits behind a useful recommendation.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-ink/65 lg:justify-self-end">
              The objective is not more specification for its own sake. It is a coherent vehicle that can be assessed against its intended commercial duty.
            </p>
          </div>

          <ol className="border-b border-line">
            {approach.map((item) => (
              <li key={item.number} className="grid gap-5 border-t border-line py-10 first:border-t-0 sm:py-12 lg:grid-cols-12 lg:items-center">
                <span className="font-display text-3xl font-black text-brand lg:col-span-1">{item.number}</span>
                <h3 className="font-display text-2xl font-black uppercase leading-tight tracking-[-0.02em] sm:text-3xl lg:col-span-5">
                  {item.title}
                </h3>
                <p className="max-w-2xl text-base leading-7 text-ink/60 lg:col-span-5 lg:col-start-8">{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-y border-line bg-sail py-20 sm:py-28">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20 lg:px-12 xl:px-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Built around business use</p>
            <h2 className="mt-4 font-display text-4xl font-black uppercase leading-[0.98] tracking-[-0.03em] sm:text-5xl">
              Different sectors. Different operating realities.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-ink/60">
              Vehicle requirements change with the work. Explore how commercial truck and body choices connect to each operating sector.
            </p>
            <Link
              href="/industries"
              className="mt-8 inline-flex items-center gap-3 text-sm font-extrabold uppercase tracking-[0.1em] text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
            >
              Explore industries
              <ArrowRight className="size-4 text-brand" aria-hidden="true" />
            </Link>
          </div>

          <div className="divide-y divide-line border-y border-line">
            {industries.map((industry, index) => (
              <Link
                key={industry.slug}
                href={`/industries#${industry.slug}`}
                className="group flex min-h-20 items-center justify-between gap-6 py-5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                <div className="flex items-center gap-5 sm:gap-8">
                  <span className="w-7 text-xs font-bold tracking-[0.12em] text-brand">{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-display text-xl font-black uppercase tracking-[-0.015em] transition-colors group-hover:text-brand sm:text-2xl">
                    {industry.name}
                  </span>
                </div>
                <ArrowUpRight className="size-5 shrink-0 text-ink/35 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid w-full max-w-[1440px] gap-12 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-12 lg:px-12 xl:px-16">
          <div className="lg:col-span-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">What we provide</p>
            <h2 className="mt-4 font-display text-4xl font-black uppercase leading-none tracking-[-0.03em] sm:text-5xl">
              One practical conversation across the requirement.
            </h2>
          </div>
          <div className="divide-y divide-white/15 border-y border-white/15 lg:col-span-7 lg:col-start-6">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services#${service.slug}`}
                className="group grid gap-2 py-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand sm:grid-cols-[3rem_1fr_auto] sm:items-center sm:gap-5"
              >
                <span className="text-xs font-bold tracking-[0.16em] text-brand">{service.number}</span>
                <span className="font-display text-lg font-black uppercase tracking-[-0.01em] transition-colors group-hover:text-brand sm:text-xl">
                  {service.title}
                </span>
                <ArrowRight className="hidden size-4 text-white/35 transition-transform group-hover:translate-x-1 group-hover:text-brand sm:block" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand text-ink">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12 xl:px-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em]">Start with a real requirement</p>
            <h2 className="mt-4 max-w-4xl font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-6xl">
              Let&apos;s define the truck around the work.
            </h2>
          </div>
          <Link
            href="/request-a-quote"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-sm bg-ink px-7 py-4 text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            Request a quote
            <ArrowUpRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
