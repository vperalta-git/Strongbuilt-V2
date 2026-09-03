import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, FileText } from "lucide-react"
import type { Truck } from "@/types/truck"

export function TruckCard({ truck, priority = false }: { truck: Truck; priority?: boolean }) {
  const image = truck.images[0]
  const quickSpecs = truck.specifications.filter((spec) => spec.featured).slice(0, 3)

  return (
    <article className="group flex h-full flex-col border border-line bg-white transition-[border-color,transform] duration-300 hover:-translate-y-1 hover:border-brand">
      <Link href={`/trucks/${truck.slug}`} className="vehicle-stage relative block aspect-[16/11] overflow-hidden bg-ink-soft" tabIndex={-1} aria-hidden="true">
        <div aria-hidden="true" className="industrial-grid-dark absolute inset-0 opacity-45" />
        <span aria-hidden="true" className="absolute -bottom-3 right-2 font-display text-7xl font-black uppercase leading-none text-white/[0.035]">{truck.brand}</span>
        {image ? (
          <Image
            src={image.url}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 31vw, (min-width: 768px) 48vw, 100vw"
            className="object-contain p-4 drop-shadow-[0_18px_20px_rgba(0,0,0,0.28)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 sm:p-5"
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center px-6 text-center text-xs font-bold uppercase tracking-[0.12em] text-white/58">Vehicle photography unavailable</span>
        )}
        <span className="absolute left-0 top-0 bg-brand px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-ink">
          {truck.bodyType}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">{truck.brand}</p>
          <p className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted">{truck.category}</p>
        </div>
        <h2 className="mt-4 min-h-[6.3rem] font-display text-[clamp(2rem,3.1vw,2.5rem)] font-black uppercase leading-[1.02] tracking-[-0.018em] [overflow-wrap:anywhere] sm:min-h-[7.4rem]">
          <Link href={`/trucks/${truck.slug}`} className="transition-colors hover:text-brand">{truck.model}</Link>
        </h2>
        <p className="mt-5 text-sm leading-6 text-muted">{truck.shortDescription}</p>

        <dl className="mt-6 grid gap-3 border-y border-line py-4 sm:grid-cols-3">
          {quickSpecs.map((spec) => (
            <div key={spec.label} className="min-w-0">
              <dt className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted">{spec.label}</dt>
              <dd className="mt-1 truncate text-xs font-bold text-ink" title={spec.value}>{spec.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto grid grid-cols-[1fr_auto] items-center gap-3 pt-5">
          <Link href={`/trucks/${truck.slug}`} className="group/link inline-flex min-h-11 items-center gap-2 border-t-2 border-ink text-xs font-extrabold uppercase tracking-[0.12em] text-ink transition-colors hover:border-brand hover:text-brand">
            View details
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
          </Link>
          <Link href={`/request-a-quote?truck=${encodeURIComponent(truck.slug)}`} className="grid h-11 w-11 place-items-center border border-line text-ink transition-colors hover:border-brand hover:bg-brand hover:text-ink" aria-label={`Request a quote for ${truck.brand} ${truck.model}`}>
            <FileText aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}
