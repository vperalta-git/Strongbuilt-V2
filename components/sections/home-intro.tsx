import { ArrowDownRight } from "lucide-react"
import { Container } from "@/components/ui/container"

export function HomeIntro() {
  return (
    <section className="relative overflow-hidden bg-paper py-20 sm:py-28 lg:py-36">
      <div aria-hidden="true" className="absolute left-0 top-0 h-full w-[7px] bg-brand" />
      <Container>
        <div className="grid gap-10 lg:grid-cols-[0.28fr_0.72fr] lg:gap-16">
          <div className="flex items-start justify-between border-t border-line pt-4 lg:block">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">What Strongbuilt does</p>
            <ArrowDownRight aria-hidden="true" className="h-6 w-6 text-ink lg:mt-10 lg:h-9 lg:w-9" />
          </div>
          <div>
            <h2 className="max-w-5xl font-display text-[clamp(3.2rem,7.5vw,7.4rem)] font-bold uppercase leading-[0.86] tracking-[-0.035em] text-ink">
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
          </div>
        </div>
      </Container>
    </section>
  )
}
