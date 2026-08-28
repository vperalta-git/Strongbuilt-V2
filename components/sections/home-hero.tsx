"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, ArrowRight, ArrowUpRight, Pause, Phone, Play } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Container } from "@/components/ui/container"
import { siteConfig } from "@/config/site"

const slides = [
  {
    code: "Fleet / 01",
    kicker: "Commercial vehicle solutions",
    title: ["Work configured", "for the real job."],
    copy: "Truck sourcing, body solutions, and practical vehicle configuration shaped around your operation.",
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
    title: ["Built around", "the load."],
    copy: "Match capacity, chassis, and body requirements to the actual material, route, and worksite.",
    image: "/images/trucks/forland-dump-3cbm.png",
    alt: "Forland 3CBM commercial dump truck",
    objectPosition: "center",
    surface: "from-[#32251d] via-[#1d1b18] to-[#0d0d0c]",
    primary: { label: "View dump trucks", href: "/trucks?type=Dump+Truck" },
    secondary: { label: "Talk to sales", href: "/contact" },
  },
  {
    code: "Routes / 03",
    kicker: "Cargo & delivery platforms",
    title: ["Right-sized for", "every route."],
    copy: "From city deliveries to regional distribution, start with route, cargo, and loading requirements.",
    image: "/images/trucks/forland-cargo-double-cab.png",
    alt: "Forland double-cabin cargo truck",
    objectPosition: "center",
    surface: "from-[#1b292b] via-[#181c1c] to-[#0c0d0d]",
    primary: { label: "Explore cargo trucks", href: "/trucks?type=Cargo" },
    secondary: { label: "Request a quote", href: "/request-a-quote" },
  },
  {
    code: "Heavy / 04",
    kicker: "Trailer & fleet requirements",
    title: ["Heavy transport", "starts here."],
    copy: "Evaluate tractor-head and trailer combinations with your payload, route, and operating cycle in view.",
    image: "/images/trucks/cimc-flatbed-40ft.png",
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
      className="relative min-h-[790px] overflow-hidden bg-ink text-white sm:min-h-[820px] lg:min-h-[780px] lg:h-[100svh] lg:max-h-[980px]"
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
      <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-60" />
      <div aria-hidden="true" className="absolute -right-[8%] top-[18%] h-[70vw] max-h-[850px] w-[70vw] max-w-[850px] rounded-full border border-white/[0.06]" />
      <div aria-hidden="true" className="absolute -right-[3%] top-[25%] h-[55vw] max-h-[670px] w-[55vw] max-w-[670px] rounded-full border border-brand/20" />
      <div aria-hidden="true" className="absolute bottom-0 right-0 h-1/2 w-[44%] bg-brand [clip-path:polygon(72%_0,100%_0,100%_100%,0_100%)] opacity-[0.12]" />

      <Container className="relative grid min-h-[790px] grid-cols-[minmax(0,1fr)] grid-rows-[auto_1fr_auto] pb-8 pt-[116px] sm:min-h-[820px] sm:pt-[132px] lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:grid-rows-[1fr_auto] lg:items-center lg:pb-9 lg:pt-[122px]">
        <div key={`copy-${active}`} className="animate-reveal-up relative z-20 min-w-0 w-[calc(100vw-2.5rem)] max-w-[calc(100vw-2.5rem)] self-center pt-7 sm:w-full sm:max-w-[760px] lg:pb-12 lg:pt-0">
          <div className="mb-6 flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand sm:text-xs">
            <span className="h-[2px] w-9 bg-brand" />
            {slide.kicker}
          </div>
          <h1 className="max-w-full font-display text-[clamp(3.05rem,13vw,8.8rem)] font-bold uppercase leading-[0.8] tracking-[-0.035em]">
            <span className="block">{slide.title[0]}</span>
            <span className="block text-brand">{slide.title[1]}</span>
          </h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/68 sm:text-lg sm:leading-8">{slide.copy}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href={slide.primary.href} className="group inline-flex min-h-14 items-center justify-center gap-3 bg-brand px-6 text-sm font-extrabold uppercase tracking-[0.12em] transition-colors hover:bg-brand-deep">
              {slide.primary.label}
              <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
            <Link href={slide.secondary.href} className="inline-flex min-h-14 items-center justify-center border border-white/30 px-6 text-sm font-extrabold uppercase tracking-[0.12em] transition-colors hover:border-white hover:bg-white hover:text-ink">
              {slide.secondary.label}
            </Link>
          </div>
        </div>

        <div key={`image-${active}`} className="animate-hero-image pointer-events-none relative z-10 mx-0 h-[300px] min-w-0 w-[calc(100vw-2.5rem)] max-w-[calc(100vw-2.5rem)] self-end sm:h-[365px] sm:w-full sm:max-w-none lg:-mr-[8vw] lg:ml-[-5vw] lg:h-[min(64vh,650px)] lg:w-auto lg:self-center">
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            priority={active === 0}
            fetchPriority={active === 0 ? "high" : "auto"}
            sizes="(min-width: 1024px) 58vw, 100vw"
            className="object-contain drop-shadow-[0_34px_38px_rgba(0,0,0,0.45)]"
            style={{ objectPosition: slide.objectPosition }}
          />
        </div>

        <div className="relative z-30 col-span-full flex w-[calc(100vw-2.5rem)] max-w-[calc(100vw-2.5rem)] items-end justify-between gap-5 border-t border-white/15 pt-5 sm:w-full sm:max-w-none">
          <div className="flex min-w-0 flex-1 items-center gap-4 sm:max-w-xl">
            <span className="shrink-0 font-display text-2xl font-bold text-brand">{String(active + 1).padStart(2, "0")}</span>
            <div className="h-[2px] min-w-10 flex-1 overflow-hidden bg-white/18">
              <span
                key={`progress-${active}-${interactionPaused}`}
                className="hero-progress-fill block h-full bg-brand"
                style={{ animationPlayState: paused ? "paused" : "running" }}
              />
            </div>
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">{slide.code}</span>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setUserPaused((value) => !value)}
              disabled={reducedMotion}
              className="grid h-11 w-11 place-items-center border border-white/25 text-white transition-colors hover:border-brand hover:bg-brand disabled:cursor-not-allowed disabled:opacity-45"
              aria-label={reducedMotion ? "Slideshow autoplay disabled by reduced-motion preference" : userPaused ? "Play slideshow" : "Pause slideshow"}
            >
              {userPaused || reducedMotion ? <Play aria-hidden="true" className="h-4 w-4" /> : <Pause aria-hidden="true" className="h-4 w-4" />}
            </button>
            <button type="button" onClick={() => goTo(active - 1)} className="grid h-11 w-11 place-items-center border border-white/25 text-white transition-colors hover:border-brand hover:bg-brand" aria-label="Previous slide">
              <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => goTo(active + 1)} className="grid h-11 w-11 place-items-center border border-white/25 text-white transition-colors hover:border-brand hover:bg-brand" aria-label="Next slide">
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Container>

      <a
        href={`tel:${siteConfig.contact.phoneHref}`}
        className="absolute bottom-[86px] right-0 z-30 hidden min-h-12 items-center gap-3 bg-white px-5 text-xs font-extrabold uppercase tracking-[0.14em] text-ink transition-colors hover:bg-brand hover:text-white 2xl:flex"
      >
        <Phone aria-hidden="true" className="h-4 w-4" />
        {siteConfig.contact.phoneDisplay}
      </a>
    </section>
  )
}
