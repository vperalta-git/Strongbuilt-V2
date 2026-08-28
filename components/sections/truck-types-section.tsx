import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Container } from "@/components/ui/container"

const types = [
  { name: "Cargo", note: "Delivery, distribution, field crews", query: "Cargo", span: "lg:col-span-2", tone: "bg-brand text-white" },
  { name: "Dump Truck", note: "Aggregates, materials, worksite hauling", query: "Dump Truck", span: "", tone: "bg-sail text-ink" },
  { name: "Tractor Head", note: "Container, trailer, long-haul operations", query: "Tractor Head", span: "", tone: "bg-paper text-ink" },
  { name: "Trailer", note: "Flat-bed, tanker, mixer applications", query: "Trailer", span: "lg:col-span-2", tone: "bg-ink-soft text-white" },
  { name: "Bus", note: "Commercial and institutional passenger fleets", query: "Bus", span: "", tone: "bg-paper text-ink" },
  { name: "Specialized / Custom", note: "Boom, aerial, utility, body solutions", query: "Specialized / Custom", span: "lg:col-span-2", tone: "bg-sail text-ink" },
]

export function TruckTypesSection() {
  return (
    <section className="bg-ink py-20 text-white sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div className="lg:sticky lg:top-36 lg:self-start">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Browse by application</p>
            <h2 className="mt-5 font-display text-[clamp(3.4rem,7vw,7rem)] font-bold uppercase leading-[0.82] tracking-[-0.035em]">
              Find the right <span className="text-brand">truck type.</span>
            </h2>
            <p className="mt-7 max-w-md text-base leading-7 text-white/60">
              Start with the body or vehicle class closest to the work. The Strongbuilt team can help refine the platform from there.
            </p>
          </div>

          <div className="grid border-l border-t border-white/12 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((type, index) => (
              <Link
                key={type.name}
                href={`/trucks?type=${encodeURIComponent(type.query)}`}
                className={`group relative flex min-h-56 flex-col justify-between overflow-hidden border-b border-r border-white/12 p-6 transition-transform duration-300 hover:z-10 hover:-translate-y-1 sm:min-h-64 lg:min-h-72 ${type.span} ${type.tone}`}
              >
                <span className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${type.tone.includes("text-white") ? "text-white/55" : "text-muted"}`}>
                  0{index + 1}
                </span>
                <div>
                  <h3 className="font-display text-[clamp(2.5rem,4vw,4.5rem)] font-bold uppercase leading-[0.85] tracking-[-0.025em]">{type.name}</h3>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <p className={`max-w-[15rem] text-sm leading-6 ${type.tone.includes("text-white") ? "text-white/68" : "text-muted"}`}>{type.note}</p>
                    <span className="grid h-11 w-11 shrink-0 place-items-center border border-current/25 transition-[background,color,border-color] group-hover:border-white group-hover:bg-white group-hover:text-ink">
                      <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
                <span aria-hidden="true" className="absolute -bottom-8 -right-4 font-display text-[9rem] font-bold leading-none text-current opacity-[0.035]">{index + 1}</span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
