"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { useState } from "react"
import { Container } from "@/components/ui/container"

const types = [
  { name: "Cargo", note: "Delivery, distribution, and field-crew configurations.", query: "Cargo", image: "/images/trucks/forland-cargo-double-cab.png" },
  { name: "Dump Truck", note: "Material movement and worksite hauling applications.", query: "Dump Truck", image: "/images/trucks/forland-dump-3cbm.png" },
  { name: "Tractor Head", note: "Container, trailer, and long-haul fleet operations.", query: "Tractor Head", image: "/images/trucks/shacman-x3000-420.png" },
  { name: "Trailer", note: "Flat-bed, tanker, mixer, and heavy-transport applications.", query: "Trailer", image: "/images/trucks/cimc-flatbed-40ft.png" },
  { name: "Bus", note: "Commercial and institutional passenger requirements.", query: "Bus", image: "/images/trucks/asiastar-ybl6119h.png" },
  { name: "Specialized", note: "Boom, aerial, utility, and custom body solutions.", query: "Specialized / Custom", image: "/images/trucks/forland-boom-truck.png" },
] as const

export function TruckTypesSection() {
  const [active, setActive] = useState(0)
  const selected = types[active]

  return (
    <section className="relative overflow-hidden bg-ink py-20 text-white sm:py-28 lg:py-32">
      <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-45" />
      <Container className="relative">
        <div className="grid gap-8 border-b border-white/14 pb-10 lg:grid-cols-[1fr_0.7fr] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand">Browse by application</p>
            <h2 className="mt-5 max-w-4xl font-display text-[clamp(3.4rem,7vw,7.2rem)] font-black uppercase leading-[0.82] tracking-[-0.04em]">
              Find your <span className="text-brand">workhorse.</span>
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-white/58 lg:justify-self-end">
            Start with the body or vehicle class closest to the job. Strongbuilt can help refine the platform around the actual application.
          </p>
        </div>

        <div className="mt-12 hidden min-h-[610px] grid-cols-[0.72fr_1.28fr] border border-white/14 lg:grid">
          <div className="divide-y divide-white/12 border-r border-white/14">
            {types.map((type, index) => (
              <button
                key={type.name}
                type="button"
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                aria-pressed={active === index}
                className={`group grid min-h-[101px] w-full grid-cols-[42px_1fr_auto] items-center gap-4 px-6 text-left transition-colors xl:px-8 ${active === index ? "bg-brand text-ink" : "text-white hover:bg-white/[0.06]"}`}
              >
                <span className={`text-[10px] font-extrabold tracking-[0.16em] ${active === index ? "text-ink/70" : "text-brand"}`}>0{index + 1}</span>
                <span className="font-display text-3xl font-black uppercase leading-none tracking-[-0.02em] xl:text-4xl">{type.name}</span>
                <ArrowUpRight aria-hidden="true" className={`h-5 w-5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 ${active === index ? "text-ink" : "text-white/55"}`} />
              </button>
            ))}
          </div>

          <div className="vehicle-stage relative overflow-hidden bg-ink-soft">
            <div aria-hidden="true" className="absolute -right-12 -top-16 font-display text-[15rem] font-black leading-none text-white/[0.025]">0{active + 1}</div>
            <Image
              key={selected.image}
              src={selected.image}
              alt={`${selected.name} commercial vehicle in the Strongbuilt catalog`}
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="animate-hero-image object-contain p-12 pb-28 drop-shadow-[0_30px_34px_rgba(0,0,0,0.45)] xl:p-16 xl:pb-32"
            />
            <div className="absolute inset-x-0 bottom-0 grid grid-cols-[1fr_auto] items-end gap-8 border-t border-white/14 bg-ink/88 p-7 backdrop-blur-sm xl:p-9">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-brand">Selected truck type</p>
                <h3 className="mt-2 font-display text-4xl font-black uppercase tracking-[-0.025em] xl:text-5xl">{selected.name}</h3>
                <p className="mt-3 max-w-lg text-sm leading-6 text-white/58">{selected.note}</p>
              </div>
              <Link href={`/trucks?type=${encodeURIComponent(selected.query)}`} className="cut-corner grid h-14 w-14 place-items-center bg-brand text-ink transition-colors hover:bg-white hover:text-ink" aria-label={`Browse ${selected.name} vehicles`}>
                <ArrowUpRight aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="hide-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 sm:-mx-8 sm:px-8 lg:hidden">
          {types.map((type, index) => (
            <Link key={type.name} href={`/trucks?type=${encodeURIComponent(type.query)}`} className="cut-corner group relative min-h-[410px] w-[82vw] max-w-[390px] shrink-0 snap-center overflow-hidden border border-white/14 bg-ink-soft">
              <div className="vehicle-stage relative h-[245px] border-b border-white/12">
                <Image src={type.image} alt={`${type.name} commercial vehicle`} fill sizes="82vw" className="object-contain p-6 drop-shadow-[0_20px_24px_rgba(0,0,0,0.4)]" />
                <span className="absolute left-5 top-5 text-[10px] font-extrabold tracking-[0.16em] text-brand">0{index + 1}</span>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-5">
                  <h3 className="font-display text-4xl font-black uppercase leading-none tracking-[-0.025em]">{type.name}</h3>
                  <ArrowUpRight aria-hidden="true" className="h-5 w-5 shrink-0 text-brand transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
                <p className="mt-4 text-sm leading-6 text-white/58">{type.note}</p>
              </div>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  )
}
