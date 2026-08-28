"use client"

import Image from "next/image"
import { useState } from "react"
import type { MediaAsset } from "@/types/truck"

export function TruckGallery({ images }: { images: MediaAsset[] }) {
  const [active, setActive] = useState(0)
  const current = images[active]

  if (!current) {
    return <div className="grid aspect-[4/3] place-items-center bg-sail text-sm text-muted">Photography pending</div>
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden bg-sail">
        <div aria-hidden="true" className="industrial-grid-dark absolute inset-0 opacity-50" />
        <Image
          key={current.url}
          src={current.url}
          alt={current.alt}
          fill
          priority
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="animate-hero-image object-contain p-5 sm:p-9"
        />
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
