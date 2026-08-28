import type { Metadata } from "next"
import { Suspense } from "react"
import { Container } from "@/components/ui/container"
import { TruckExplorer } from "@/components/trucks/truck-explorer"
import { getTrucks } from "@/lib/data/trucks"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Commercial Truck Catalog",
  description: "Browse Strongbuilt commercial trucks by brand, body type, and business application. Request a configuration-specific quotation from the sales team.",
  alternates: { canonical: "/trucks" },
  openGraph: {
    title: "Commercial Truck Catalog | Strongbuilt",
    description: "Explore commercial trucks, trailers, and specialized vehicle platforms in the Strongbuilt catalog.",
    url: "/trucks",
  },
}

function CatalogSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[265px_1fr]">
      <div className="hidden h-[560px] animate-pulse bg-sail lg:block" />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse bg-sail" />)}
      </div>
    </div>
  )
}

export default async function TrucksPage() {
  const trucks = await getTrucks()

  return (
    <>
      <section className="relative overflow-hidden bg-ink pb-16 pt-40 text-white sm:pb-20 sm:pt-48 lg:pb-24 lg:pt-56">
        <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-60" />
        <div aria-hidden="true" className="absolute -right-24 bottom-0 h-[85%] w-[58%] bg-brand [clip-path:polygon(72%_0,100%_0,100%_100%,0_100%)] opacity-[0.13]" />
        <Container className="relative">
          <div className="max-w-5xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Strongbuilt commercial catalog</p>
            <h1 className="mt-6 font-display text-[clamp(4.5rem,11vw,10rem)] font-bold uppercase leading-[0.76] tracking-[-0.04em]">Trucks for the <span className="text-brand">work ahead.</span></h1>
            <div className="mt-9 grid max-w-4xl gap-6 border-t border-white/15 pt-7 sm:grid-cols-[auto_1fr] sm:items-start sm:gap-10">
              <p className="font-display text-5xl font-bold text-brand">{String(trucks.length).padStart(2, "0")}</p>
              <p className="max-w-2xl text-base leading-7 text-white/62">Search documented platforms by brand and body type. Specifications shown here come from the current Strongbuilt reference catalog and should be confirmed during quotation.</p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-paper py-12 sm:py-16 lg:py-20">
        <Container>
          <Suspense fallback={<CatalogSkeleton />}>
            <TruckExplorer trucks={trucks} />
          </Suspense>
        </Container>
      </section>
    </>
  )
}
