import Image from "next/image"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { brands } from "@/lib/data/brands"
import { Container } from "@/components/ui/container"
import { SectionHeading } from "@/components/ui/section-heading"

export function BrandsSection() {
  return (
    <section className="bg-paper py-20 sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-8 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <SectionHeading eyebrow="Commercial vehicle brands" title={<>Platforms for different <span className="text-brand">duties.</span></>} />
          <p className="text-base leading-7 text-muted">
            Explore the brands and commercial platforms documented in the Strongbuilt catalog. Current specifications and availability are confirmed during quotation.
          </p>
        </div>

        <div className="mt-14 border-t border-line">
          {brands.map((brand, index) => (
            <Link key={brand.slug} href={`/trucks?brand=${encodeURIComponent(brand.name)}`} className="group grid min-h-28 items-center gap-5 border-b border-line py-6 sm:grid-cols-[46px_180px_1fr_46px] sm:gap-8 lg:grid-cols-[60px_250px_1fr_52px]">
              <span className="text-[10px] font-extrabold tracking-[0.16em] text-muted">0{index + 1}</span>
              <div className="relative flex h-14 items-center sm:h-16">
                {brand.logoUrl ? (
                  <Image src={brand.logoUrl} alt={`${brand.name} logo`} width={220} height={80} className="max-h-12 w-auto max-w-[180px] object-contain object-left grayscale transition-[filter,opacity] group-hover:grayscale-0 sm:max-h-14" />
                ) : (
                  <span className="font-display text-3xl font-bold uppercase tracking-[-0.02em]">{brand.name}</span>
                )}
              </div>
              <p className="text-sm leading-6 text-muted">{brand.catalogNote}</p>
              <span className="hidden h-11 w-11 place-items-center border border-line transition-colors group-hover:border-brand group-hover:bg-brand group-hover:text-white sm:grid">
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
