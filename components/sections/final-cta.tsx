import Image from "next/image"
import { Mail, Phone } from "lucide-react"
import { siteConfig } from "@/config/site"
import { Container } from "@/components/ui/container"
import { ButtonLink } from "@/components/ui/button-link"

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-28 lg:py-36">
      <Image src="/images/editorial/industrial-worksite.png" alt="" fill sizes="100vw" className="object-cover object-left opacity-35" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/95 to-ink" />
      <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-35" />
      <Container className="relative">
        <div className="ml-auto max-w-5xl border-l-2 border-brand pl-6 sm:pl-10 lg:pl-14">
          <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand">Bring us the requirement</p>
          <h2 className="mt-6 font-display text-[clamp(3.8rem,8.5vw,8.7rem)] font-black uppercase leading-[0.78] tracking-[-0.045em]">
            Need the right truck <span className="block text-brand">for the job?</span>
          </h2>
          <p className="mt-8 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
            Tell us what the truck needs to do. Start with the load, route, body, quantity, and application.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <ButtonLink href="/request-a-quote" size="lg">Request a quote</ButtonLink>
            <ButtonLink href="/trucks" variant="outline-light" size="lg">Browse trucks</ButtonLink>
          </div>
          <div className="mt-9 flex flex-col gap-4 text-sm text-white/62 sm:flex-row sm:gap-8">
            <a href={`tel:${siteConfig.contact.phoneHref}`} className="flex items-center gap-3 transition-colors hover:text-white"><Phone aria-hidden="true" className="h-4 w-4 text-brand" />{siteConfig.contact.phoneDisplay}</a>
            <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-3 transition-colors hover:text-white"><Mail aria-hidden="true" className="h-4 w-4 text-brand" />{siteConfig.contact.email}</a>
          </div>
        </div>
      </Container>
    </section>
  )
}
