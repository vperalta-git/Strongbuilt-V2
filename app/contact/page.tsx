import type { Metadata } from "next"
import { ArrowDownRight, ArrowUpRight, Clock3, Mail, MapPin, Phone } from "lucide-react"

import { InquiryForm } from "@/components/forms/inquiry-form"
import { Container } from "@/components/ui/container"
import { siteConfig } from "@/config/site"

const title = "Contact"
const description =
  "Contact the Strongbuilt sales team about commercial trucks, body requirements, fleet needs, and vehicle configuration."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/contact" },
  openGraph: {
    title: `${title} | ${siteConfig.name}`,
    description,
    type: "website",
    url: "/contact",
  },
}

export default function ContactPage() {
  const mapEmbedUrl = process.env.NEXT_PUBLIC_MAP_EMBED_URL?.trim()

  return (
    <>
      <section className="relative overflow-hidden bg-ink pb-16 pt-36 text-white sm:pb-20 sm:pt-44 lg:pb-24 lg:pt-52">
        <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-55" />
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-[38%] border-l border-white/8 bg-brand/8" />
        <Container className="relative">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.48fr] lg:items-end">
            <div className="max-w-5xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Contact Strongbuilt</p>
              <h1 className="mt-6 font-display text-[clamp(4.5rem,10vw,9.5rem)] font-bold uppercase leading-[0.78] tracking-[-0.04em]">
                Let&apos;s talk about the <span className="text-brand">work ahead.</span>
              </h1>
              <p className="mt-8 max-w-2xl text-base leading-7 text-white/62 sm:text-lg sm:leading-8">
                Ask about a truck, body requirement, fleet application, or the next step in building a commercial vehicle brief.
              </p>
            </div>

            <div className="border-t border-white/18 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.18em] text-white/65">Direct sales line</p>
              <a
                href={`tel:${siteConfig.contact.phoneHref}`}
                className="mt-3 inline-flex items-center gap-3 font-display text-3xl font-bold text-white transition-colors hover:text-brand sm:text-4xl"
              >
                <Phone aria-hidden="true" className="size-5 text-brand" />
                {siteConfig.contact.phoneDisplay}
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="mt-5 flex items-center gap-3 break-all text-sm font-semibold text-white/60 transition-colors hover:text-white"
              >
                <Mail aria-hidden="true" className="size-4 shrink-0 text-brand" />
                {siteConfig.contact.email}
              </a>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-paper py-16 sm:py-20 lg:py-28">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[0.56fr_1fr] lg:gap-12 xl:gap-16">
            <aside className="self-start bg-ink text-white lg:sticky lg:top-32">
              <div className="border-b border-white/12 p-6 sm:p-8 lg:p-10">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Sales contacts</p>
                <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-[-0.025em] sm:text-5xl">
                  Reach the team directly.
                </h2>
                <p className="mt-5 text-sm leading-6 text-white/55">
                  For time-sensitive inquiries, call during the listed business hours. You can also email or send the form with the context the team needs.
                </p>
              </div>

              <address className="not-italic">
                <a
                  href={`tel:${siteConfig.contact.phoneHref}`}
                  className="group flex gap-4 border-b border-white/12 p-6 transition-colors hover:bg-white/5 sm:p-8 lg:p-10"
                >
                  <Phone aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span>
                    <span className="block text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-white/65">Telephone</span>
                    <span className="mt-2 block text-base font-bold transition-colors group-hover:text-brand">{siteConfig.contact.phoneDisplay}</span>
                  </span>
                </a>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="group flex gap-4 border-b border-white/12 p-6 transition-colors hover:bg-white/5 sm:p-8 lg:p-10"
                >
                  <Mail aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span className="min-w-0">
                    <span className="block text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-white/65">Email</span>
                    <span className="mt-2 block break-all text-base font-bold transition-colors group-hover:text-brand">{siteConfig.contact.email}</span>
                  </span>
                </a>
                <div className="flex gap-4 border-b border-white/12 p-6 sm:p-8 lg:p-10">
                  <MapPin aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span>
                    <span className="block text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-white/65">Office address</span>
                    <span className="mt-2 block text-sm font-semibold leading-6 text-white/72">
                      {siteConfig.contact.addressLines.map((line) => (
                        <span key={line} className="block">{line}</span>
                      ))}
                    </span>
                  </span>
                </div>
                <div className="flex gap-4 p-6 sm:p-8 lg:p-10">
                  <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" />
                  <span>
                    <span className="block text-[0.65rem] font-extrabold uppercase tracking-[0.18em] text-white/65">Business hours</span>
                    <span className="mt-2 block text-sm font-semibold leading-6 text-white/72">{siteConfig.contact.hours}</span>
                  </span>
                </div>
              </address>
            </aside>

            <div className="border border-line bg-white p-5 shadow-[var(--shadow-small)] sm:p-8 lg:p-10 xl:p-12">
              <div className="mb-9 border-b border-line pb-8">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Send an inquiry</p>
                    <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.9] tracking-[-0.025em] sm:text-5xl">
                      How can we help?
                    </h2>
                  </div>
                  <ArrowDownRight aria-hidden="true" className="hidden size-9 shrink-0 text-brand sm:block" />
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-muted">
                  Share your question and contact details. No account is required, and the form is kept focused on information useful for a response.
                </p>
              </div>
              <InquiryForm variant="contact" />
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-sail py-16 sm:py-20 lg:py-24">
        <Container>
          <div className="grid border border-line bg-paper lg:grid-cols-[0.58fr_1fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Location</p>
              <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.92] tracking-[-0.025em] sm:text-5xl">
                Strongbuilt office
              </h2>
              <address className="mt-6 not-italic text-base leading-8 text-muted">
                {siteConfig.contact.addressLines.map((line) => (
                  <span key={line} className="block">{line}</span>
                ))}
              </address>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="mt-8 inline-flex items-center gap-3 text-xs font-extrabold uppercase tracking-[0.12em] text-ink transition-colors hover:text-brand"
              >
                Confirm your visit
                <ArrowUpRight aria-hidden="true" className="size-4 text-brand" />
              </a>
            </div>

            <div className="relative min-h-[360px] overflow-hidden border-t border-line bg-ink lg:min-h-[440px] lg:border-l lg:border-t-0">
              {mapEmbedUrl ? (
                <iframe
                  title="Strongbuilt office location map"
                  src={mapEmbedUrl}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0 h-full w-full border-0"
                  allowFullScreen
                />
              ) : (
                <div className="industrial-grid relative flex h-full min-h-[360px] items-end p-7 text-white sm:p-10 lg:min-h-[440px] lg:p-12">
                  <div aria-hidden="true" className="absolute right-8 top-8 font-display text-[8rem] font-bold leading-none text-white/5 sm:text-[11rem]">PH</div>
                  <div className="relative max-w-lg border-l-2 border-brand pl-5">
                    <MapPin aria-hidden="true" className="mb-5 size-7 text-brand" />
                    <p className="font-display text-3xl font-bold uppercase leading-tight">Office location</p>
                    <address className="mt-3 not-italic text-sm leading-6 text-white/60">
                      {siteConfig.contact.addressLines.map((line) => (
                        <span key={line} className="block">{line}</span>
                      ))}
                    </address>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>
    </>
  )
}
