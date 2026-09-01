import Image from "next/image"
import Link from "next/link"
import { Mail, MapPin, Phone } from "lucide-react"
import { siteConfig } from "@/config/site"
import { Container } from "@/components/ui/container"

const truckLinks = [
  { label: "Cargo trucks", href: "/trucks?type=Cargo" },
  { label: "Dump trucks", href: "/trucks?type=Dump+Truck" },
  { label: "Tractor heads", href: "/trucks?type=Tractor+Head" },
  { label: "Trailers", href: "/trucks?type=Trailer" },
  { label: "Specialized builds", href: "/trucks?type=Specialized+%2F+Custom" },
]

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="border-y border-white/10">
        <Container className="grid lg:grid-cols-[1.15fr_0.85fr]">
          <div className="border-white/10 py-14 lg:border-r lg:py-20 lg:pr-14">
            <Image
              src="/images/brand/strongbuilt-logo-light.png"
              alt="Strongbuilt Motors and Equipment Inc."
              width={1680}
              height={558}
              className="h-auto w-[230px] sm:w-[275px]"
            />
            <p className="mt-7 max-w-lg text-base leading-7 text-white/60">
              Commercial trucks, body solutions, and fleet-focused configuration for businesses that need the right vehicle for the work.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link className="border border-white/18 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors hover:border-brand hover:text-brand" href="/request-a-quote">
                Request a quote
              </Link>
              <Link className="border border-white/18 px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors hover:border-brand hover:text-brand" href="/trucks">
                Browse trucks
              </Link>
            </div>
          </div>

          <div className="grid gap-10 py-14 sm:grid-cols-2 lg:py-20 lg:pl-14">
            <div>
              <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Contact sales</p>
              <ul className="space-y-4 text-sm leading-6 text-white/68">
                <li>
                  <a href={`tel:${siteConfig.contact.phoneHref}`} className="flex gap-3 transition-colors hover:text-white">
                    <Phone aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand" />
                    {siteConfig.contact.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${siteConfig.contact.email}`} className="flex gap-3 break-all transition-colors hover:text-white">
                    <Mail aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand" />
                    {siteConfig.contact.email}
                  </a>
                </li>
                <li className="flex gap-3">
                  <MapPin aria-hidden="true" className="mt-1 h-4 w-4 shrink-0 text-brand" />
                  <span>{siteConfig.contact.addressLines.join(", ")}</span>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-5 text-xs font-extrabold uppercase tracking-[0.18em] text-brand">Truck catalog</p>
              <ul className="space-y-3 text-sm text-white/68">
                {truckLinks.map((item) => (
                  <li key={item.href}>
                    <Link className="transition-colors hover:text-white" href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Container>
      </div>

      <Container className="grid gap-8 py-10 md:grid-cols-[1fr_auto] md:items-end">
        <div className="flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-[0.12em] text-white/45">
          {siteConfig.nav.map((item) => <Link key={item.href} href={item.href} className="hover:text-white">{item.label}</Link>)}
          <Link href="/privacy" className="hover:text-white">Privacy</Link>
        </div>
        <p className="text-xs leading-5 text-white/55 md:text-right">© {new Date().getFullYear()} {siteConfig.legalName}</p>
      </Container>
    </footer>
  )
}
