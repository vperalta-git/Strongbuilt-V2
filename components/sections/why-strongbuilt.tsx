import { ClipboardCheck, Layers3, Route, Wrench } from "lucide-react"
import { Container } from "@/components/ui/container"
import { SectionHeading } from "@/components/ui/section-heading"

const values = [
  {
    icon: ClipboardCheck,
    title: "Requirement-first selection",
    copy: "The shortlist begins with payload, route, environment, and operating purpose.",
  },
  {
    icon: Layers3,
    title: "Multiple platform options",
    copy: "Compare relevant vehicle classes and documented brands without forcing one answer onto every job.",
  },
  {
    icon: Wrench,
    title: "Body and chassis thinking",
    copy: "Treat the base truck and working body as one commercial configuration.",
  },
  {
    icon: Route,
    title: "Business-focused consultation",
    copy: "Keep the discussion tied to routes, loads, crews, fleet standards, and daily use.",
  },
]

export function WhyStrongbuilt() {
  return (
    <section className="bg-sail py-20 sm:py-28 lg:py-32">
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionHeading eyebrow="Why Strongbuilt" title={<>Clarity before <span className="text-brand">commitment.</span></>} />
          <p className="max-w-2xl text-lg leading-8 text-muted lg:pb-1">
            A commercial vehicle is an operating decision. Strongbuilt helps buyers organize the questions that matter before a unit is selected.
          </p>
        </div>

        <div className="mt-14 grid border-l border-t border-line sm:grid-cols-2 lg:grid-cols-4">
          {values.map((value, index) => (
            <article key={value.title} className="relative min-h-72 border-b border-r border-line p-6 sm:p-8">
              <div className="flex items-start justify-between">
                <value.icon aria-hidden="true" className="h-8 w-8 stroke-[1.5] text-brand" />
                <span className="text-[10px] font-extrabold tracking-[0.15em] text-muted">0{index + 1}</span>
              </div>
              <h3 className="mt-14 font-display text-3xl font-bold uppercase leading-[0.95]">{value.title}</h3>
              <p className="mt-4 text-sm leading-6 text-muted">{value.copy}</p>
            </article>
          ))}
        </div>
      </Container>
    </section>
  )
}
