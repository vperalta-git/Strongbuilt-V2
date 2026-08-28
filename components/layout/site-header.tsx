"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Menu, Phone, X } from "lucide-react"
import { siteConfig } from "@/config/site"
import { Container } from "@/components/ui/container"
import { ButtonLink } from "@/components/ui/button-link"

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const mobileNavRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 18)
    update()
    window.addEventListener("scroll", update, { passive: true })
    return () => window.removeEventListener("scroll", update)
  }, [])

  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    const menuButton = menuButtonRef.current
    document.body.style.overflow = "hidden"

    const desktopQuery = window.matchMedia("(min-width: 1280px)")
    const closeAtDesktop = () => {
      if (desktopQuery.matches) setOpen(false)
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
      if (event.key !== "Tab") return

      const focusable = mobileNavRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable?.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    desktopQuery.addEventListener("change", closeAtDesktop)
    window.addEventListener("keydown", closeOnEscape)
    requestAnimationFrame(() => mobileNavRef.current?.querySelector<HTMLElement>("a[href]")?.focus())

    return () => {
      document.body.style.overflow = previous
      desktopQuery.removeEventListener("change", closeAtDesktop)
      window.removeEventListener("keydown", closeOnEscape)
      menuButton?.focus()
    }
  }, [open])

  return (
    <header className="fixed inset-x-0 top-0 z-50 text-white">
      <a href="#main-content" className="sr-only-focusable absolute left-4 top-4 z-[70] bg-white px-4 py-3 font-bold text-ink">
        Skip to content
      </a>

      <div className="hidden border-b border-white/10 bg-ink/95 text-[11px] font-bold uppercase tracking-[0.14em] text-white/65 lg:block">
        <Container className="flex h-9 items-center justify-between">
          <p>Commercial trucks · body solutions · fleet requirements</p>
          <a className="flex items-center gap-2 transition-colors hover:text-brand" href={`tel:${siteConfig.contact.phoneHref}`}>
            <Phone aria-hidden="true" className="h-3.5 w-3.5" />
            {siteConfig.contact.phoneDisplay}
          </a>
        </Container>
      </div>

      <div
        className={`border-b transition-colors duration-300 ${
          scrolled || open ? "border-white/10 bg-ink/96 shadow-2xl shadow-black/20 backdrop-blur-md" : "border-white/12 bg-ink/82 backdrop-blur-sm"
        }`}
      >
        <Container className="flex h-[74px] items-center justify-between lg:h-[82px]">
          <Link href="/" aria-label="Strongbuilt home" onClick={() => setOpen(false)} className="relative z-[60] block w-[178px] sm:w-[205px]">
            <Image
              src="/images/brand/strongbuilt-logo-light.png"
              alt="Strongbuilt Motors and Equipment Inc."
              width={1680}
              height={558}
              priority
              className="h-auto w-full"
            />
          </Link>

          <nav aria-label="Primary navigation" className="hidden items-center gap-1 xl:flex">
            {siteConfig.nav.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative px-3 py-3 text-xs font-bold uppercase tracking-[0.14em] transition-colors after:absolute after:inset-x-3 after:bottom-1 after:h-[2px] after:origin-left after:bg-brand after:transition-transform ${
                    active ? "text-white after:scale-x-100" : "text-white/68 after:scale-x-0 hover:text-white hover:after:scale-x-100"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="hidden xl:block">
            <ButtonLink href="/request-a-quote" size="sm">Request a quote</ButtonLink>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            className="relative z-[60] grid h-12 w-12 place-items-center border border-white/20 text-white transition-colors hover:border-brand hover:text-brand xl:hidden"
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </Container>
      </div>

      <div
        ref={mobileNavRef}
        id="mobile-navigation"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed inset-0 z-50 bg-ink pt-[74px] transition-[opacity,visibility] duration-300 lg:pt-[119px] xl:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div aria-hidden="true" className="industrial-grid absolute inset-0 opacity-60" />
        <Container className="relative flex h-full flex-col overflow-y-auto py-8">
          <nav aria-label="Mobile navigation" className="border-t border-white/12">
            {siteConfig.nav.map((item, index) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="group flex items-center justify-between border-b border-white/12 py-4 sm:py-5"
                >
                  <span className={`font-display text-4xl font-bold uppercase sm:text-5xl ${active ? "text-brand" : "text-white"}`}>
                    {item.label}
                  </span>
                  <span className="text-xs font-bold tracking-[0.18em] text-white/55">0{index + 1}</span>
                </Link>
              )
            })}
          </nav>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <ButtonLink href="/request-a-quote" size="lg">Request a quote</ButtonLink>
            <a
              href={`tel:${siteConfig.contact.phoneHref}`}
              className="flex min-h-14 items-center justify-center gap-3 border border-white/25 px-6 text-sm font-bold uppercase tracking-[0.12em] text-white"
            >
              <Phone aria-hidden="true" className="h-4 w-4 text-brand" />
              Call sales
            </a>
          </div>
        </Container>
      </div>
    </header>
  )
}
