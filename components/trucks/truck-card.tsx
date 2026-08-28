import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight, FileText } from "lucide-react"
import type { Truck } from "@/types/truck"

export function TruckCard({ truck, priority = false }: { truck: Truck; priority?: boolean }) {
  const image = truck.images[0]
  const quickSpecs = truck.specifications.filter((spec) => spec.featured).slice(0, 3)

  return (
    <article className="group flex h-full flex-col border border-line bg-white transition-[border-color,transform,box-shadow] duration-300 hover:-translate-y-1 hover:border-brand hover:shadow-[var(--shadow-small)]">
      <Link href={`/trucks/${truck.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-sail" tabIndex={-1} aria-hidden="true">
        <div aria-hidden="true" className="industrial-grid-dark absolute inset-0 opacity-45" />
        {image ? (
          <Image
            src={image.url}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1280px) 31vw, (min-width: 768px) 48vw, 100vw"
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        <span className="absolute left-0 top-0 bg-ink px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-white">
          {truck.bodyType}
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand">{truck.brand}</p>
        <h2 className="mt-2 font-display text-3xl font-bold uppercase leading-[0.95] tracking-[-0.02em]">
          <Link href={`/trucks/${truck.slug}`} className="transition-colors hover:text-brand">{truck.model}</Link>
        </h2>
        <p className="mt-4 text-sm leading-6 text-muted">{truck.shortDescription}</p>

        <dl className="mt-6 grid gap-3 border-y border-line py-4 sm:grid-cols-3">
          {quickSpecs.map((spec) => (
            <div key={spec.label} className="min-w-0">
              <dt className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-muted">{spec.label}</dt>
              <dd className="mt-1 truncate text-xs font-bold text-ink" title={spec.value}>{spec.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <Link href={`/trucks/${truck.slug}`} className="group/link inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-ink transition-colors hover:text-brand">
            View details
            <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
          </Link>
          <Link href={`/request-a-quote?truck=${encodeURIComponent(truck.slug)}`} className="grid h-10 w-10 place-items-center border border-line text-ink transition-colors hover:border-brand hover:bg-brand hover:text-white" aria-label={`Request a quote for ${truck.brand} ${truck.model}`}>
            <FileText aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  )
}
