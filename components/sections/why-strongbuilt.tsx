import { ArrowDownRight } from "lucide-react"
import { Container } from "@/components/ui/container"

const values = [
  ["Requirement first", "Payload, route, environment, and operating purpose shape the shortlist."],
  ["Multi-brand sourcing", "Relevant commercial platforms can be compared without forcing one answer onto every job."],
  ["Body and chassis thinking", "The base truck and working body are considered as one commercial configuration."],
  ["Business-focused coordination", "The discussion stays tied to routes, loads, crews, standards, and daily use."],
] as const

export function WhyStrongbuilt() {
  return (
    <section className="border-y border-line bg-sail py-20 sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div className="lg:sticky lg:top-36 lg:self-start">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-brand">Why Strongbuilt</p>
            <h2 className="mt-5 font-display text-[clamp(3.4rem,6.4vw,6.5rem)] font-black uppercase leading-[0.84] tracking-[-0.04em] text-ink">
              Clarity before <span className="text-brand">commitment.</span>
            </h2>
            <p className="mt-7 max-w-lg text-base leading-7 text-muted">A commercial vehicle is an operating decision. The useful questions come before the unit selection.</p>
            <ArrowDownRight aria-hidden="true" className="mt-10 hidden h-10 w-10 text-brand lg:block" />
          </div>

          <ol className="border-t border-line">
            {values.map(([title, copy], index) => (
              <li key={title} className="group grid gap-5 border-b border-line py-8 sm:grid-cols-[52px_0.8fr_1fr] sm:items-start sm:gap-7 lg:py-10">
                <span className="font-display text-2xl font-black text-brand">0{index + 1}</span>
                <h3 className="font-display text-3xl font-black uppercase leading-[0.94] tracking-[-0.025em] transition-colors group-hover:text-brand sm:text-4xl">{title}</h3>
                <p className="max-w-lg text-sm leading-6 text-muted sm:text-base sm:leading-7">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  )
}
