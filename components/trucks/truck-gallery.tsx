"use client"

import Image from "next/image"
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react"
import { useRef, useState } from "react"
import type { MediaAsset } from "@/types/truck"

export function TruckGallery({ images }: { images: MediaAsset[] }) {
  const [active, setActive] = useState(0)
  const touchStart = useRef<number | null>(null)
  const current = images[active]

  const move = (direction: number) => setActive((index) => (index + direction + images.length) % images.length)

  if (!current) {
    return <div className="grid aspect-[4/3] place-items-center bg-sail text-sm text-muted">Vehicle photography unavailable</div>
  }

  return (
    <div className="w-full">
      <div
        className="vehicle-stage relative aspect-[3/2] overflow-hidden bg-sail lg:aspect-[4/3]"
        onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null }}
        onTouchEnd={(event) => {
          if (touchStart.current === null || images.length < 2) return
          const distance = (event.changedTouches[0]?.clientX ?? touchStart.current) - touchStart.current
          if (Math.abs(distance) > 45) move(distance < 0 ? 1 : -1)
          touchStart.current = null
        }}
      >
        <div aria-hidden="true" className="industrial-grid-dark absolute inset-0 opacity-50" />
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(min-width: 1440px) 52vw, (min-width: 1024px) 56vw, 100vw"
          className="animate-hero-image object-contain p-3 drop-shadow-[0_24px_26px_rgba(0,0,0,0.18)] sm:p-6 lg:p-7"
        />
        <a href={current.url} target="_blank" rel="noreferrer" className="absolute right-4 top-4 grid h-11 w-11 place-items-center border border-ink/20 bg-paper/92 text-ink transition-colors hover:border-brand hover:bg-brand hover:text-ink" aria-label="Open full-size vehicle image">
          <Maximize2 aria-hidden="true" className="h-4 w-4" />
        </a>
        {images.length > 1 ? (
          <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
            <button type="button" onClick={() => move(-1)} className="grid h-12 w-12 place-items-center bg-ink text-white transition-colors hover:bg-brand hover:text-ink" aria-label="Previous vehicle image"><ChevronLeft aria-hidden="true" /></button>
            <button type="button" onClick={() => move(1)} className="grid h-12 w-12 place-items-center bg-ink text-white transition-colors hover:bg-brand hover:text-ink" aria-label="Next vehicle image"><ChevronRight aria-hidden="true" /></button>
          </div>
        ) : null}
        <p className="absolute bottom-4 left-4 bg-ink px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.15em] text-white">
          Image {String(active + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
        </p>
      </div>

      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-3" aria-label="Vehicle gallery thumbnails">
          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              aria-label={`View image ${index + 1}: ${image.alt}`}
              aria-pressed={active === index}
              onClick={() => setActive(index)}
              className={`relative aspect-[4/3] overflow-hidden border bg-sail ${active === index ? "border-brand" : "border-line hover:border-ink"}`}
            >
              <Image src={image.url} alt="" fill sizes="160px" className="object-contain p-2" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
