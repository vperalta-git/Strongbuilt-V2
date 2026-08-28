import type { Metadata } from "next"
import { Check, FileText, Mail, Phone, ShieldCheck } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

import { InquiryForm } from "@/components/forms/inquiry-form"
import { Container } from "@/components/ui/container"
import { siteConfig } from "@/config/site"
import { getTruckBySlug } from "@/lib/data/trucks"

const title = "Request a Quote"
const description =
  "Send Strongbuilt your commercial truck, body, or fleet requirement and request a configuration-specific quotation without creating an account."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/request-a-quote" },
  openGraph: {
    title: `${title} | ${siteConfig.name}`,
    description,
    type: "website",
    url: "/request-a-quote",
  },
}

type RequestQuotePageProps = {
  searchParams: Promise<{
    truck?: string | string[]
  }>
}

const usefulDetails = [
  "Truck or body type",
  "Intended load or application",
  "Route or operating environment",
  "Quantity and useful timing context",
] as const

export default async function RequestQuotePage({ searchParams }: RequestQuotePageProps) {
  const query = await searchParams
  const truckSlug = Array.isArray(query.truck) ? query.truck[0] : query.truck
  const selectedTruck = truckSlug ? await getTruckBySlug(truckSlug) : null
  const selectedImage = selectedTruck?.images[0]

  return (
    <>
      <section className="relative overflow-hidden bg-ink pb-16 pt-36 text-white sm:pb-20 sm:pt-44 lg:pb-24 lg:pt-52">
        <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-55" />
        <div aria-hidden="true" className="absolute -right-20 bottom-0 h-[88%] w-[46%] bg-brand/12 [clip-path:polygon(64%_0,100%_0,100%_100%,0_100%)]" />
        <Container className="relative">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.42fr] lg:items-end">
            <div className="max-w-5xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Commercial quotation request</p>
              <h1 className="mt-6 font-display text-[clamp(4.5rem,10vw,9.5rem)] font-bold uppercase leading-[0.78] tracking-[-0.04em]">
                Build the brief. <span className="text-brand">Start the quote.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-base leading-7 text-white/62 sm:text-lg sm:leading-8">
                Share the truck, body, route, load, or application you are considering. Strongbuilt can use that context to organize the next configuration and quotation discussion.
              </p>
            </div>

            <div className="border-t border-white/18 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <ShieldCheck aria-hidden="true" className="size-7 text-brand" />
              <p className="mt-4 font-display text-2xl font-bold uppercase">No account required</p>
              <p className="mt-3 text-sm leading-6 text-white/52">
                Send the requirement directly. Only the information needed to understand and respond to the inquiry is requested.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-paper py-16 sm:py-20 lg:py-28">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.52fr_1fr] lg:gap-12 xl:gap-16">
            <aside className="space-y-6 self-start lg:sticky lg:top-32">
              {selectedTruck ? (
                <div className="overflow-hidden border border-line bg-white shadow-[var(--shadow-small)]">
                  <div className="relative aspect-[16/10] overflow-hidden bg-sail">
                    <div aria-hidden="true" className="industrial-grid-dark absolute inset-0 opacity-45" />
                    {selectedImage ? (
                      <Image
                        src={selectedImage.url}
                        alt={selectedImage.alt}
                        fill
                        sizes="(min-width: 1024px) 34vw, 100vw"
                        className="object-contain p-5"
                      />
                    ) : null}
                    <span className="absolute left-0 top-0 bg-brand px-3 py-2 text-[0.65rem] font-extrabold uppercase tracking-[0.15em] text-white">
                      Selected truck
                    </span>
                  </div>
                  <div className="p-6 sm:p-8">
                    <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-brand">{selectedTruck.brand}</p>
                    <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-[0.94] tracking-[-0.02em]">
                      {selectedTruck.model}
                    </h2>
                    <div className="mt-5 flex flex-wrap gap-2 text-[0.65rem] font-extrabold uppercase tracking-[0.1em] text-muted">
                      <span className="border border-line px-3 py-2">{selectedTruck.category}</span>
                      <span className="border border-line px-3 py-2">{selectedTruck.bodyType}</span>
                    </div>
                    <Link
                      href={`/trucks/${selectedTruck.slug}`}
                      className="mt-6 inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-ink transition-colors hover:text-brand"
                    >
                      Review truck details
                      <FileText aria-hidden="true" className="size-4 text-brand" />
                    </Link>
                  </div>
                </div>
              ) : null}

              <div className="bg-ink p-6 text-white sm:p-8 lg:p-10">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Useful details to include</p>
                <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.92] tracking-[-0.025em]">
                  The work is the starting point.
                </h2>
                <ul className="mt-7 divide-y divide-white/12 border-y border-white/12">
                  {usefulDetails.map((detail) => (
                    <li key={detail} className="flex gap-3 py-4 text-sm font-semibold leading-6 text-white/68">
                      <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-brand" />
                      {detail}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 text-xs leading-5 text-white/58">
                  Share what is already known. Exact technical details can be clarified during the sales discussion.
                </p>
              </div>
            </aside>

            <div id="quote-form" className="scroll-mt-28 border border-line bg-white p-5 shadow-[var(--shadow-small)] sm:p-8 lg:p-10 xl:p-12">
              <div className="mb-9 border-b border-line pb-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Your requirement</p>
                <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-[-0.025em] sm:text-5xl">
                  Request a commercial quote
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-muted">
                  Complete the fields below so the sales team can understand the application and contact you using your preferred method.
                </p>
              </div>
              <InquiryForm
                variant="quote"
                initialSelectedTruck={
                  selectedTruck
                    ? {
                        slug: selectedTruck.slug,
                        label: `${selectedTruck.brand} ${selectedTruck.model}`,
                      }
                    : null
                }
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-sail py-14 sm:py-18">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Prefer a direct conversation?</p>
              <h2 className="mt-3 font-display text-3xl font-bold uppercase leading-none sm:text-4xl">
                Call or email the Strongbuilt sales team.
              </h2>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <a
                href={`tel:${siteConfig.contact.phoneHref}`}
                className="inline-flex min-h-13 items-center justify-center gap-3 bg-ink px-6 text-xs font-extrabold uppercase tracking-[0.12em] text-white transition-colors hover:bg-brand"
              >
                <Phone aria-hidden="true" className="size-4" />
                {siteConfig.contact.phoneDisplay}
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="inline-flex min-h-13 items-center justify-center gap-3 border border-ink/25 px-6 text-xs font-extrabold uppercase tracking-[0.12em] text-ink transition-colors hover:border-brand hover:text-brand"
              >
                <Mail aria-hidden="true" className="size-4" />
                Email sales
              </a>
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
