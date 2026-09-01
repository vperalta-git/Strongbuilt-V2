"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Phone, Play } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Container } from "@/components/ui/container"
import { siteConfig } from "@/config/site"

const slides = [
  {
    code: "Heavy duty / 01",
    kicker: "Strongbuilt commercial vehicles",
    title: ["Built for", "the work."],
    copy: "Commercial trucks and body solutions configured around real operating requirements.",
    vehicle: "SHACMAN X3000",
    vehicleType: "420 HP / 6×4 tractor head",
    image: "/images/trucks/shacman-x3000-420.png",
    alt: "SHACMAN X3000 heavy-duty tractor head",
    objectPosition: "center",
    surface: "from-[#201d19] via-[#181816] to-[#0c0c0b]",
    primary: { label: "Browse trucks", href: "/trucks" },
    secondary: { label: "Request a quote", href: "/request-a-quote" },
  },
  {
    code: "Worksite / 02",
    kicker: "Dump & construction applications",
    title: ["Move the load.", "Own the work."],
    copy: "Match capacity, chassis, and body requirements to the actual material, route, and worksite.",
    image: "/images/trucks/forland-dump-3cbm.png",
    vehicle: "FORLAND 3CBM",
    vehicleType: "Commercial dump truck",
    alt: "Forland 3CBM commercial dump truck",
    objectPosition: "center",
    surface: "from-[#32251d] via-[#1d1b18] to-[#0d0d0c]",
    primary: { label: "View dump trucks", href: "/trucks?type=Dump+Truck" },
    secondary: { label: "Talk to sales", href: "/contact" },
  },
  {
    code: "Routes / 03",
    kicker: "Cargo & delivery platforms",
    title: ["Right truck.", "Every route."],
    copy: "From city deliveries to regional distribution, start with route, cargo, and loading requirements.",
    image: "/images/trucks/forland-cargo-double-cab.png",
    vehicle: "FORLAND DOUBLE CAB",
    vehicleType: "Cargo / crew configuration",
    alt: "Forland double-cabin cargo truck",
    objectPosition: "center",
    surface: "from-[#1b292b] via-[#181c1c] to-[#0c0d0d]",
    primary: { label: "Explore cargo trucks", href: "/trucks?type=Cargo" },
    secondary: { label: "Request a quote", href: "/request-a-quote" },
  },
  {
    code: "Heavy / 04",
    kicker: "Trailer & fleet requirements",
    title: ["Heavy transport.", "No guesswork."],
    copy: "Evaluate tractor-head and trailer combinations with your payload, route, and operating cycle in view.",
    image: "/images/trucks/cimc-flatbed-40ft.png",
    vehicle: "CIMC FLAT-BED",
    vehicleType: "40-foot commercial trailer",
    alt: "CIMC 40-foot flat-bed commercial trailer",
    objectPosition: "center",
    surface: "from-[#27251e] via-[#181816] to-[#0b0b0a]",
    primary: { label: "Browse heavy transport", href: "/trucks?type=Trailer" },
    secondary: { label: "Contact sales", href: "/contact" },
  },
]

export function HomeHero() {
  const [active, setActive] = useState(0)
  const [hoverPaused, setHoverPaused] = useState(false)
  const [interactionPaused, setInteractionPaused] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [announcement, setAnnouncement] = useState("")
  const touchStart = useRef<number | null>(null)
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const paused = hoverPaused || interactionPaused || userPaused || reducedMotion

  const goTo = useCallback((index: number, isInteraction = true) => {
    const nextIndex = (index + slides.length) % slides.length
    setActive(nextIndex)
    if (!isInteraction) return
    setAnnouncement(`Slide ${nextIndex + 1} of ${slides.length}: ${slides[nextIndex]?.title.join(" ")}`)
    setInteractionPaused(true)
    if (pauseTimer.current) clearTimeout(pauseTimer.current)
    pauseTimer.current = setTimeout(() => setInteractionPaused(false), 12000)
  }, [])

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReducedMotion(query.matches)
    update()
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])

  useEffect(() => {
    if (paused) return
    const interval = window.setInterval(() => setActive((index) => (index + 1) % slides.length), 7500)
    return () => window.clearInterval(interval)
  }, [paused, active])

  useEffect(() => () => {
    if (pauseTimer.current) clearTimeout(pauseTimer.current)
  }, [])

  const slide = slides[active]

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Strongbuilt commercial truck solutions"
      className="relative min-h-[820px] overflow-hidden bg-ink text-white sm:min-h-[900px] lg:h-[100svh] lg:min-h-[760px] lg:max-h-[980px]"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHoverPaused(false)
      }}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null
      }}
      onTouchEnd={(event) => {
        if (touchStart.current === null) return
        const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current
        if (Math.abs(distance) > 50) goTo(active + (distance < 0 ? 1 : -1))
        touchStart.current = null
      }}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.surface} transition-colors duration-700`} />
      <p className="sr-only" aria-live="polite" aria-atomic="true">{announcement}</p>
      <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-50" />
      <div aria-hidden="true" className="absolute inset-y-0 right-0 w-[48%] border-l border-white/[0.06] bg-white/[0.018]" />
      <div aria-hidden="true" className="absolute -right-[6%] top-[14%] hidden font-display text-[clamp(12rem,21vw,23rem)] font-black uppercase leading-none tracking-[-0.06em] text-white/[0.025] lg:block">SB</div>
      <div aria-hidden="true" className="absolute bottom-0 right-0 h-[42%] w-[46%] bg-brand [clip-path:polygon(78%_0,100%_0,100%_100%,0_100%)] opacity-[0.14]" />

      <Container className="relative grid min-h-[820px] min-w-0 grid-cols-[minmax(0,1fr)] grid-rows-[auto_auto_1fr_auto] pb-7 pt-[112px] sm:min-h-[900px] sm:pb-9 sm:pt-[132px] lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:grid-rows-[1fr_auto] lg:items-center lg:pt-[122px]">
        <div key={`copy-${active}`} className="animate-reveal-up relative z-20 min-w-0 self-center pt-8 sm:max-w-[760px] lg:pb-10 lg:pt-0">
          <div className="mb-5 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.24em] text-brand sm:text-xs">
            <span className="h-[2px] w-10 bg-brand" />{slide.kicker}
          </div>
          <p aria-hidden="true" className="mb-4 font-display text-xl font-bold uppercase tracking-[0.28em] text-white/38 sm:text-2xl">Strongbuilt</p>
          <h1 className="max-w-full text-balance font-display text-[clamp(3.45rem,16vw,5.5rem)] font-black uppercase leading-[0.78] tracking-[-0.045em] sm:text-[clamp(5rem,12vw,7.5rem)] lg:text-[clamp(5.7rem,7.2vw,8.6rem)]">
            <span className="block">{slide.title[0]}</span>
            <span className="block text-brand">{slide.title[1]}</span>
          </h1>
          <p className="mt-6 max-w-lg text-sm leading-6 text-white/66 sm:mt-7 sm:text-lg sm:leading-8">{slide.copy}</p>
          <div className="mt-7 flex flex-col gap-3 min-[430px]:flex-row sm:mt-8">
            <Link href={slide.primary.href} className="cut-corner group inline-flex min-h-14 items-center justify-center gap-3 bg-brand px-6 text-xs font-extrabold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-brand-deep hover:text-white sm:text-sm">
              {slide.primary.label}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link href={slide.secondary.href} className="inline-flex min-h-14 items-center justify-center border border-white/50 px-6 text-xs font-extrabold uppercase tracking-[0.14em] text-white transition-colors hover:border-white hover:bg-white hover:text-ink sm:text-sm">
              {slide.secondary.label}
            </Link>
          </div>
        </div>

        <div key={`image-${active}`} className="animate-hero-image pointer-events-none relative z-10 h-[250px] min-w-0 self-end sm:h-[330px] lg:-mr-[7vw] lg:ml-[-8vw] lg:h-[min(68vh,690px)] lg:self-center">
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            priority={active === 0}
            fetchPriority={active === 0 ? "high" : "auto"}
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="hero-vehicle-idle object-contain drop-shadow-[0_36px_42px_rgba(0,0,0,0.52)]"
            style={{ objectPosition: slide.objectPosition }}
          />
        </div>

        <div className="relative z-30 col-span-full grid min-w-0 gap-5 border-t border-white/15 pt-5 sm:grid-cols-[1fr_auto] sm:items-end">
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-bold uppercase tracking-[0.04em] text-white sm:text-2xl">{slide.vehicle}</p>
            <p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/68 sm:text-[10px]">{slide.vehicleType}</p>
            <div className="mt-4 flex min-w-0 items-center gap-4 sm:max-w-xl">
              <span className="shrink-0 font-display text-2xl font-bold text-brand">{String(active + 1).padStart(2, "0")}</span>
              <div className="h-[2px] min-w-10 flex-1 overflow-hidden bg-white/18">
              <span
                key={`progress-${active}-${interactionPaused}`}
                className="hero-progress-fill block h-full bg-brand"
                style={{ animationPlayState: paused ? "paused" : "running" }}
              />
              </div>
              <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.16em] text-white/68 sm:text-[10px]">{slide.code}</span>
            </div>
          </div>

          <div className="flex gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => setUserPaused((value) => !value)}
              disabled={reducedMotion}
              className="grid h-11 w-11 place-items-center border border-white/35 text-white transition-colors hover:border-brand hover:bg-brand hover:text-ink disabled:cursor-not-allowed disabled:border-white/20 disabled:text-white/55 disabled:opacity-100"
              aria-label={reducedMotion ? "Slideshow autoplay disabled by reduced-motion preference" : userPaused ? "Play slideshow" : "Pause slideshow"}
            >
              {userPaused || reducedMotion ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => goTo(active - 1)} className="grid h-11 w-11 place-items-center border border-white/35 text-white transition-colors hover:border-brand hover:bg-brand hover:text-ink" aria-label="Previous slide">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => goTo(active + 1)} className="grid h-11 w-11 place-items-center border border-white/35 text-white transition-colors hover:border-brand hover:bg-brand hover:text-ink" aria-label="Next slide">
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Container>

      <a
        href={`tel:${siteConfig.contact.phoneHref}`}
        className="absolute bottom-[86px] right-0 z-30 hidden min-h-12 items-center gap-3 bg-white px-5 text-xs font-extrabold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-brand hover:text-ink 2xl:flex"
      >
        <Phone aria-hidden="true" className="h-4 w-4" />
        {siteConfig.contact.phoneDisplay}
      </a>
    </section>
  )
}
