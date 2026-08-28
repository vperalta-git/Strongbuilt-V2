import { ArrowDown, ArrowRight, ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { services } from "@/lib/data/services"

const serviceCount = String(services.length).padStart(2, "0")

const workingSequence = [
  {
    number: "A",
    title: "Define the job",
    description: "Clarify the route, load, frequency, access constraints, operating environment, and fleet standards.",
  },
  {
    number: "B",
    title: "Shape the configuration",
    description: "Compare the commercial platform, body, drivetrain, dimensions, and useful equipment as one work vehicle.",
  },
  {
    number: "C",
    title: "Coordinate the next step",
    description: "Organize the product questions, configuration details, and quotation requirements for a clearer buying decision.",
  },
] as const

export function ServicesPageContent() {
  return (
    <div className="overflow-hidden bg-sail text-ink">
      <section className="relative bg-ink pt-28 text-white sm:pt-32">
        <div className="mx-auto grid min-h-[620px] w-full max-w-[1600px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex items-center px-5 py-16 sm:px-8 sm:py-20 lg:px-12 xl:px-20">
            <div className="max-w-3xl">
              <div className="mb-7 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.22em] text-brand">
                <span className="h-0.5 w-10 bg-brand" />
                Commercial vehicle solutions
              </div>
              <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-[-0.04em] text-balance sm:text-7xl xl:text-[6.4rem]">
                A better truck starts with a better brief.
              </h1>
              <p className="mt-8 max-w-2xl text-base leading-7 text-white/70 sm:text-lg sm:leading-8">
                Strongbuilt brings sourcing, body requirements, and vehicle configuration into one practical conversation—built around what the business needs the truck to do.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  href="#service-lines"
                  className="inline-flex min-h-12 items-center gap-3 rounded-sm bg-brand px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  Explore services
                  <ArrowDown className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center gap-3 rounded-sm border border-white/30 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:border-white hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Contact sales
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>

          <div className="relative min-h-[420px] border-t border-white/10 lg:min-h-full lg:border-l lg:border-t-0">
            <Image
              src="/images/editorial/industrial-worksite.png"
              alt="Industrial team working at an active facility"
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover object-[24%_center]"
            />
            <div className="absolute inset-0 bg-ink/20" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-ink/75 p-6 backdrop-blur-[2px] sm:p-8">
              <p className="max-w-xs text-xs font-bold uppercase leading-5 tracking-[0.18em] text-white/65">
                Platform, body, and application considered together
              </p>
              <span className="font-display text-5xl font-black text-brand">{serviceCount}</span>
            </div>
          </div>
        </div>
        <div className="h-1 bg-brand" />
      </section>

      <section className="border-b border-line bg-sail py-14 sm:py-18">
        <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-5 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-12 xl:px-16">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Jump to a service</p>
          <nav aria-label="Services on this page" className="flex flex-wrap gap-x-7 gap-y-4">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`#${service.slug}`}
                className="group inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.1em] text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                <span className="text-brand">{service.number}</span>
                {service.title}
              </Link>
            ))}
          </nav>
        </div>
      </section>

      <section id="service-lines" className="scroll-mt-24 bg-paper py-20 sm:py-28">
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="grid gap-8 border-b border-line pb-12 sm:pb-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">What Strongbuilt provides</p>
              <h2 className="mt-4 font-display text-4xl font-black uppercase leading-none tracking-[-0.03em] sm:text-6xl">
                From requirement to road-ready direction.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-ink/65 lg:justify-self-end">
              Each service supports the same objective: a commercial vehicle configuration that buyers can evaluate against the real work, without treating the chassis and body as separate decisions.
            </p>
          </div>

          <ol className="border-b border-line">
            {services.map((service) => (
              <li
                key={service.slug}
                id={service.slug}
                className="group scroll-mt-28 border-t border-line first:border-t-0"
              >
                <div className="grid gap-6 py-12 sm:py-16 lg:grid-cols-12 lg:gap-10 lg:py-20">
                  <div className="lg:col-span-1">
                    <span className="font-display text-3xl font-black text-brand">{service.number}</span>
                  </div>
                  <div className="lg:col-span-4">
                    <h3 className="max-w-md font-display text-3xl font-black uppercase leading-[0.98] tracking-[-0.025em] transition-colors group-hover:text-brand sm:text-4xl">
                      {service.title}
                    </h3>
                  </div>
                  <div className="lg:col-span-3">
                    <p className="max-w-md text-lg font-semibold leading-7 text-ink/85">{service.summary}</p>
                  </div>
                  <div className="lg:col-span-4 lg:pl-8">
                    <p className="max-w-lg text-base leading-7 text-ink/60">{service.detail}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-brand text-ink">
        <div className="mx-auto w-full max-w-[1440px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12 xl:px-16">
          <div className="grid gap-8 border-b border-ink/25 pb-12 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em]">A practical working sequence</p>
              <h2 className="mt-4 max-w-3xl font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-6xl">
                Start with the work. Then shape the truck.
              </h2>
            </div>
            <p className="max-w-xl text-base font-medium leading-7 text-ink/75 lg:justify-self-end">
              The discussion moves from operating requirements to a coherent configuration and a more useful quotation brief.
            </p>
          </div>

          <ol className="grid lg:grid-cols-3">
            {workingSequence.map((step, index) => (
              <li
                key={step.number}
                className="border-b border-ink/25 py-10 last:border-b-0 lg:border-b-0 lg:border-r lg:px-10 lg:first:pl-0 lg:last:border-r-0 lg:last:pr-0"
              >
                <div className="flex items-center justify-between">
                  <span className="font-display text-4xl font-black">{step.number}</span>
                  {index < workingSequence.length - 1 ? (
                    <ArrowRight className="hidden size-5 lg:block" aria-hidden="true" />
                  ) : null}
                </div>
                <h3 className="mt-10 font-display text-2xl font-black uppercase tracking-[-0.02em]">{step.title}</h3>
                <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-ink/70">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-ink text-white">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12 xl:px-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Have a vehicle requirement?</p>
            <h2 className="mt-4 max-w-4xl font-display text-4xl font-black uppercase leading-none tracking-[-0.03em] sm:text-6xl">
              Bring us the job, the route, and the load.
            </h2>
          </div>
          <Link
            href="/request-a-quote"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-sm bg-brand px-7 py-4 text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            Request a quote
            <ArrowUpRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
