import { ArrowDownRight } from "lucide-react"
import { Container } from "@/components/ui/container"

const requirementSignals = ["Load", "Route", "Body", "Duty cycle"] as const

export function HomeIntro() {
  return (
    <section className="relative overflow-hidden bg-paper py-20 sm:py-28 lg:py-36">
      <div aria-hidden="true" className="absolute left-0 top-0 h-full w-[6px] bg-brand" />
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.25fr_0.75fr] lg:gap-16">
          <div className="flex items-start justify-between border-t border-line pt-4 lg:block">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">What Strongbuilt does</p>
            <ArrowDownRight aria-hidden="true" className="h-6 w-6 text-ink lg:mt-10 lg:h-9 lg:w-9" />
          </div>
          <div>
            <h2 className="max-w-5xl font-display text-[clamp(3.35rem,7.8vw,7.8rem)] font-black uppercase leading-[0.82] tracking-[-0.045em] text-ink">
              We don&apos;t start with a truck. <span className="text-brand">We start with the work.</span>
            </h2>
            <div className="mt-10 grid gap-8 border-t border-line pt-8 md:grid-cols-2 md:gap-14">
              <p className="text-lg font-semibold leading-8 text-ink">
                Strongbuilt helps businesses source commercial vehicles and body solutions around the load, route, site, and operating requirement.
              </p>
              <p className="text-base leading-7 text-muted">
                That means a clearer shortlist, a more useful configuration discussion, and a buying process focused on what the vehicle must accomplish every day.
              </p>
            </div>
            <ol className="mt-12 grid border-l border-t border-line sm:grid-cols-2 xl:grid-cols-4">
              {requirementSignals.map((signal, index) => (
                <li key={signal} className="group flex min-h-28 flex-col justify-between border-b border-r border-line p-5 transition-colors hover:bg-sail sm:min-h-32">
                  <span className="text-[10px] font-extrabold tracking-[0.16em] text-brand">0{index + 1}</span>
                  <span className="font-display text-2xl font-black uppercase tracking-[-0.02em] text-ink sm:text-3xl">{signal}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  )
}
