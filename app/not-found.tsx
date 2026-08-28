import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Container } from "@/components/ui/container"

export default function NotFound() {
  return (
    <section className="grid min-h-[78vh] place-items-center bg-ink pb-20 pt-40 text-white">
      <Container className="text-center">
        <p className="font-display text-[clamp(7rem,22vw,18rem)] font-bold leading-[0.7] text-brand">404</p>
        <h1 className="mt-8 font-display text-5xl font-bold uppercase sm:text-7xl">This route is off the map.</h1>
        <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-white/60">The page or vehicle may have moved, or the catalog link is no longer active.</p>
        <Link href="/trucks" className="mt-8 inline-flex min-h-13 items-center gap-3 bg-white px-6 text-xs font-extrabold uppercase tracking-[0.14em] text-ink hover:bg-brand hover:text-white"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Browse trucks</Link>
      </Container>
    </section>
  )
}
