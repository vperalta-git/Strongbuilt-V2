import { ArrowRight, ArrowUpRight } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { industries } from "@/lib/data/industries"

const industryCount = String(industries.length).padStart(2, "0")

function truckFilterHref(bodyType: string) {
  return `/trucks?type=${encodeURIComponent(bodyType)}`
}

export function IndustriesPageContent() {
  return (
    <div className="overflow-hidden bg-sail text-ink">
      <section className="relative isolate min-h-[680px] overflow-hidden bg-ink text-white sm:min-h-[740px]">
        <Image
          src="/images/editorial/industrial-worksite.png"
          alt="Industrial worksite supported by commercial operations"
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[30%_center] sm:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-ink/45" />
        <div className="absolute inset-y-0 right-0 -z-10 w-full bg-ink/80 lg:w-[58%]" />
        <div className="absolute inset-y-0 right-[8%] hidden w-px bg-white/15 lg:block" />

        <div className="mx-auto flex min-h-[680px] w-full max-w-[1440px] items-end px-5 pb-14 pt-32 sm:min-h-[740px] sm:px-8 sm:pb-20 lg:items-center lg:px-12 lg:pb-0 lg:pt-28 xl:px-16">
          <div className="grid w-full gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(520px,1fr)] lg:items-center">
            <div className="hidden lg:block" aria-hidden="true">
              <p className="font-display text-[clamp(5rem,10vw,10rem)] leading-none text-white/10">
                {industryCount}
              </p>
            </div>

            <div className="relative max-w-3xl lg:pl-12">
              <div className="mb-7 flex items-center gap-4 text-xs font-bold uppercase tracking-[0.22em] text-brand">
                <span className="h-0.5 w-10 bg-brand" />
                Industries we support
              </div>
              <h1 className="font-display text-5xl font-black uppercase leading-[0.92] tracking-[-0.035em] text-balance sm:text-7xl lg:text-[5.6rem]">
                The vehicle has to fit the work.
              </h1>
              <p className="mt-7 max-w-2xl text-base leading-7 text-white/75 sm:text-lg sm:leading-8">
                Route, payload, loading method, and operating environment all shape the right commercial vehicle. We help connect those requirements to a practical truck and body configuration.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="#industry-sectors"
                  className="inline-flex min-h-12 items-center gap-3 rounded-sm bg-brand px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-ink transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  Find your sector
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/request-a-quote"
                  className="inline-flex min-h-12 items-center gap-3 rounded-sm border border-white/35 px-6 py-3 text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:border-white hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  Discuss a requirement
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-1 bg-brand" />
      </section>

      <section className="border-b border-line bg-sail">
        <div className="mx-auto grid w-full max-w-[1440px] px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:px-12 xl:px-16">
          <div className="flex items-start gap-5 border-b border-line pb-8 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12">
            <span className="font-display text-6xl font-black leading-none text-brand sm:text-7xl">
              {industryCount}
            </span>
            <p className="max-w-40 pt-2 text-xs font-bold uppercase leading-5 tracking-[0.18em] text-ink/55">
              Operating sectors in focus
            </p>
          </div>
          <div className="pt-8 lg:pl-16 lg:pt-0">
            <p className="max-w-4xl font-display text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              A truck is productive only when its platform, body, and duty cycle make sense together.
            </p>
          </div>
        </div>
      </section>

      <section id="industry-sectors" className="scroll-mt-24 bg-paper py-20 sm:py-28">
        <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12 xl:px-16">
          <div className="mb-14 grid gap-5 border-b border-line pb-8 sm:mb-20 lg:grid-cols-2 lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">Application-led planning</p>
              <h2 className="mt-4 max-w-3xl font-display text-4xl font-black uppercase leading-none tracking-[-0.03em] sm:text-6xl">
                Start with the operation.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-7 text-ink/65 lg:justify-self-end">
              Every sector below links the work being done to relevant commercial body types. Final configuration should always be assessed against the specific route, load, and operating conditions.
            </p>
          </div>

          <div className="divide-y divide-line border-b border-line">
            {industries.map((industry, index) => {
              const isEven = index % 2 === 0

              return (
                <article
                  key={industry.slug}
                  id={industry.slug}
                  className="scroll-mt-24 py-14 sm:py-20 lg:py-24"
                >
                  <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
                    <div className={isEven ? "lg:col-span-5" : "lg:order-2 lg:col-span-5 lg:col-start-8"}>
                      <div className="relative overflow-hidden rounded-sm bg-ink shadow-[var(--shadow-large)]">
                        <div className="relative aspect-[333/138]">
                          <Image
                            src={industry.image.url}
                            alt={industry.image.alt}
                            fill
                            sizes="(min-width: 1024px) 40vw, 100vw"
                            className="object-cover transition-transform duration-700 hover:scale-[1.025]"
                          />
                        </div>
                        <div className="flex items-center justify-between border-t border-white/10 bg-ink px-5 py-4 text-white">
                          <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">
                            Sector {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="h-px w-16 bg-brand" />
                        </div>
                      </div>
                    </div>

                    <div className={isEven ? "lg:col-span-6 lg:col-start-7" : "lg:order-1 lg:col-span-6"}>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand">{industry.eyebrow}</p>
                      <h3 className="mt-3 font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.025em] sm:text-5xl">
                        {industry.name}
                      </h3>
                      <p className="mt-5 max-w-2xl text-xl font-semibold leading-8 text-ink/85">{industry.summary}</p>
                      <p className="mt-5 max-w-2xl text-base leading-7 text-ink/60">{industry.description}</p>

                      <div className="mt-8 grid gap-7 border-y border-line py-6 sm:grid-cols-2">
                        <div>
                          <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted">Typical applications</p>
                          <ul className="space-y-2 text-sm font-semibold text-ink/75">
                            {industry.applications.map((application) => (
                              <li key={application} className="flex gap-3">
                                <span className="mt-2 size-1.5 shrink-0 bg-brand" aria-hidden="true" />
                                {application}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="mb-3 text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted">Relevant body types</p>
                          <div className="flex flex-wrap gap-2">
                            {industry.recommendedBodyTypes.map((bodyType) => (
                              <Link
                                key={bodyType}
                                href={truckFilterHref(bodyType)}
                                className="rounded-sm border border-line bg-white/50 px-3 py-2 text-xs font-bold text-ink transition-colors hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                              >
                                {bodyType}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={truckFilterHref(industry.recommendedBodyTypes[0])}
                        className="mt-7 inline-flex items-center gap-3 text-sm font-extrabold uppercase tracking-[0.1em] text-ink transition-colors hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                      >
                        Browse relevant trucks
                        <ArrowRight className="size-4 text-brand" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-brand text-ink">
        <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12 xl:px-16">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em]">Your operation is the brief</p>
            <h2 className="mt-4 max-w-4xl font-display text-4xl font-black uppercase leading-[0.95] tracking-[-0.03em] sm:text-6xl">
              Tell us what the truck needs to do.
            </h2>
          </div>
          <Link
            href="/request-a-quote"
            className="inline-flex min-h-14 items-center justify-center gap-3 rounded-sm bg-ink px-7 py-4 text-sm font-extrabold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
          >
            Start a requirement
            <ArrowUpRight className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  )
}
