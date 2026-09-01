"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import type { Truck } from "@/types/truck"
import { TruckCard } from "@/components/trucks/truck-card"

type SortOption = "featured" | "model-asc" | "model-desc"

type InitialFilters = {
  query: string
  brand: string
  bodyType: string
  sort: SortOption
}

function FilterPanel({
  brands,
  bodyTypes,
  brand,
  bodyType,
  setBrand,
  setBodyType,
  reset,
  showBrands = true,
}: {
  brands: string[]
  bodyTypes: string[]
  brand: string
  bodyType: string
  setBrand: (brand: string) => void
  setBodyType: (type: string) => void
  reset: () => void
  showBrands?: boolean
}) {
  return (
    <div>
      <div className="flex items-center justify-between border-b border-line pb-5">
        <h2 className="font-display text-3xl font-bold uppercase">Filters</h2>
        <button type="button" onClick={reset} className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-muted underline decoration-line underline-offset-4 hover:text-brand">
          Reset all
        </button>
      </div>

      {showBrands ? <fieldset className="border-b border-line py-6">
        <legend className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink">Brand</legend>
        <div className="mt-4 grid gap-1.5">
          {["", ...brands].map((option) => (
            <button
              key={option || "all-brands"}
              type="button"
              aria-pressed={brand === option}
              onClick={() => setBrand(option)}
              className={`flex min-h-11 items-center justify-between border px-3 text-left text-sm transition-colors ${
                brand === option ? "border-ink bg-ink font-bold text-white" : "border-transparent text-muted hover:border-line hover:text-ink"
              }`}
            >
              <span>{option || "All brands"}</span>
              <span className={`h-2 w-2 ${brand === option ? "bg-brand" : "border border-line"}`} />
            </button>
          ))}
        </div>
      </fieldset> : null}

      <fieldset className="py-6">
        <legend className="text-xs font-extrabold uppercase tracking-[0.16em] text-ink">Truck / body type</legend>
        <div className="mt-4 grid gap-1.5">
          {["", ...bodyTypes].map((option) => (
            <button
              key={option || "all-types"}
              type="button"
              aria-pressed={bodyType === option}
              onClick={() => setBodyType(option)}
              className={`flex min-h-11 items-center justify-between border px-3 text-left text-sm transition-colors ${
                bodyType === option ? "border-ink bg-ink font-bold text-white" : "border-transparent text-muted hover:border-line hover:text-ink"
              }`}
            >
              <span>{option || "All types"}</span>
              <span className={`h-2 w-2 ${bodyType === option ? "bg-brand" : "border border-line"}`} />
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  )
}

export function TruckExplorer({ trucks }: { trucks: Truck[] }) {
  const searchParams = useSearchParams()
  const sortParam = searchParams.get("sort")
  const initial: InitialFilters = {
    query: searchParams.get("search") || "",
    brand: searchParams.get("brand") || "",
    bodyType: searchParams.get("type") || "",
    sort: sortParam === "model-asc" || sortParam === "model-desc" ? sortParam : "featured",
  }

  return <TruckExplorerState key={searchParams.toString()} trucks={trucks} initial={initial} />
}

function TruckExplorerState({ trucks, initial }: { trucks: Truck[]; initial: InitialFilters }) {
  const router = useRouter()
  const pathname = usePathname()
  const [query, setQuery] = useState(initial.query)
  const [brand, setBrand] = useState(initial.brand)
  const [bodyType, setBodyType] = useState(initial.bodyType)
  const [sort, setSort] = useState<SortOption>(initial.sort)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const filterButtonRef = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.dataset.catalogHydrated = "true"
    return () => {
      delete document.documentElement.dataset.catalogHydrated
    }
  }, [])

  const brands = useMemo(() => [...new Set(trucks.map((truck) => truck.brand))].sort(), [trucks])
  const bodyTypes = useMemo(() => [...new Set(trucks.map((truck) => truck.bodyType))].sort(), [trucks])

  useEffect(() => {
    if (!mobileFiltersOpen) return
    const previous = document.body.style.overflow
    const filterButton = filterButtonRef.current
    document.body.style.overflow = "hidden"

    const desktopQuery = window.matchMedia("(min-width: 1024px)")
    const closeAtDesktop = () => {
      if (desktopQuery.matches) setMobileFiltersOpen(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileFiltersOpen(false)
      if (event.key !== "Tab") return

      const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
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
    requestAnimationFrame(() => drawerRef.current?.querySelector<HTMLElement>("button")?.focus())
    return () => {
      document.body.style.overflow = previous
      desktopQuery.removeEventListener("change", closeAtDesktop)
      window.removeEventListener("keydown", closeOnEscape)
      filterButton?.focus()
    }
  }, [mobileFiltersOpen])

  const syncUrl = (updates: Partial<InitialFilters> = {}) => {
    const values = { query, brand, bodyType, sort, ...updates }
    const params = new URLSearchParams()
    if (values.query.trim()) params.set("search", values.query.trim())
    if (values.brand) params.set("brand", values.brand)
    if (values.bodyType) params.set("type", values.bodyType)
    if (values.sort !== "featured") params.set("sort", values.sort)
    const queryString = params.toString()
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
  }

  const selectBrand = (value: string) => {
    setBrand(value)
    if (!mobileFiltersOpen) syncUrl({ brand: value })
  }

  const selectBodyType = (value: string) => {
    setBodyType(value)
    if (!mobileFiltersOpen) syncUrl({ bodyType: value })
  }

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const result = trucks.filter((truck) => {
      const searchable = [
        truck.brand,
        truck.model,
        truck.bodyType,
        truck.category,
        truck.shortDescription,
        ...truck.applications,
      ]
        .join(" ")
        .toLowerCase()

      return (!normalized || searchable.includes(normalized)) && (!brand || truck.brand === brand) && (!bodyType || truck.bodyType === bodyType)
    })

    return result.sort((a, b) => {
      if (sort === "model-asc") return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`)
      if (sort === "model-desc") return `${b.brand} ${b.model}`.localeCompare(`${a.brand} ${a.model}`)
      return Number(b.featured) - Number(a.featured) || a.displayOrder - b.displayOrder
    })
  }, [trucks, query, brand, bodyType, sort])

  const activeFilterCount = Number(Boolean(brand)) + Number(Boolean(bodyType))
  const reset = () => {
    setQuery("")
    setBrand("")
    setBodyType("")
    setSort("featured")
    router.replace(pathname, { scroll: false })
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[265px_1fr] xl:gap-12">
      <div className="min-w-0 border-y border-line py-5 lg:col-span-2">
        <div className="mb-4 flex items-center justify-between gap-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">Shop by brand</p>
          {brand ? <button type="button" onClick={() => selectBrand("")} className="text-[10px] font-extrabold uppercase tracking-[0.15em] text-brand hover:text-brand-deep">Clear brand</button> : null}
        </div>
        <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter catalog by brand">
          {["", ...brands].map((option) => (
            <button
              key={option || "all-brands-rail"}
              type="button"
              aria-pressed={brand === option}
              onClick={() => selectBrand(option)}
              className={`cut-corner min-h-12 shrink-0 border px-5 text-xs font-extrabold uppercase tracking-[0.12em] transition-colors ${brand === option ? "border-ink bg-ink text-white" : "border-line bg-white text-ink hover:border-brand hover:text-brand"}`}
            >
              {option || "All brands"}
            </button>
          ))}
        </div>
      </div>

      <aside className="hidden lg:block">
        <div className="sticky top-36 border border-line bg-paper p-6">
          <FilterPanel brands={brands} bodyTypes={bodyTypes} brand={brand} bodyType={bodyType} setBrand={selectBrand} setBodyType={selectBodyType} reset={reset} showBrands={false} />
        </div>
      </aside>

      <div className="min-w-0">
        <div className="grid gap-3 border-b border-line pb-6 sm:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Search truck catalog</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onBlur={() => syncUrl({ query })}
              onKeyDown={(event) => {
                if (event.key === "Enter") syncUrl({ query })
              }}
              placeholder="Search brand, model, body type, or application"
              className="h-13 w-full border border-line bg-white pl-11 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-muted/90 hover:border-ink/45 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </label>

          <div className="grid grid-cols-2 gap-3 sm:flex">
            <button ref={filterButtonRef} type="button" onClick={() => setMobileFiltersOpen(true)} className="inline-flex h-13 items-center justify-center gap-2 border border-line bg-white px-4 text-xs font-extrabold uppercase tracking-[0.12em] lg:hidden">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
              Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
            </button>
            <label className="relative">
              <span className="sr-only">Sort trucks</span>
              <select value={sort} onChange={(event) => {
                const value = event.target.value as SortOption
                setSort(value)
                syncUrl({ sort: value })
              }} className="h-13 w-full appearance-none border border-line bg-white px-4 pr-10 text-xs font-extrabold uppercase tracking-[0.1em] outline-none focus:border-brand sm:w-52">
                <option value="featured">Featured first</option>
                <option value="model-asc">Model A–Z</option>
                <option value="model-desc">Model Z–A</option>
              </select>
              <span aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px]">▼</span>
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          <p className="text-sm text-muted" aria-live="polite">
            <strong className="text-ink">{filtered.length}</strong> {filtered.length === 1 ? "vehicle" : "vehicles"}
            {brand || bodyType ? " matching current filters" : " in the catalog"}
          </p>
          {activeFilterCount || query ? (
            <button type="button" onClick={reset} className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-brand hover:text-brand-deep">
              <X aria-hidden="true" className="h-4 w-4" /> Clear filters
            </button>
          ) : null}
        </div>

        {filtered.length ? (
          <div className="grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((truck, index) => <TruckCard key={truck.slug} truck={truck} priority={index < 2} />)}
          </div>
        ) : (
          <div className="grid min-h-[360px] place-items-center border border-line bg-sail p-8 text-center">
            <div className="max-w-md">
              <p className="font-display text-4xl font-bold uppercase">No exact match</p>
              <p className="mt-4 text-sm leading-6 text-muted">Try a broader search or clear the filters. You can also send Strongbuilt a requirement even if a matching unit is not yet listed.</p>
              <button type="button" onClick={reset} className="mt-6 min-h-12 bg-ink px-5 text-xs font-extrabold uppercase tracking-[0.14em] text-white hover:bg-brand hover:text-ink">Reset catalog</button>
            </div>
          </div>
        )}
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-[80] lg:hidden" role="dialog" aria-modal="true" aria-labelledby="mobile-filter-title">
          <button type="button" aria-label="Close filters" className="absolute inset-0 bg-black/65" onClick={() => setMobileFiltersOpen(false)} />
          <div ref={drawerRef} className="absolute inset-y-0 right-0 w-[min(92vw,420px)] overflow-y-auto bg-paper p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="mobile-filter-title" className="font-display text-4xl font-bold uppercase">Filter catalog</h2>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters" className="grid h-11 w-11 place-items-center border border-line hover:border-brand hover:text-brand"><X aria-hidden="true" /></button>
            </div>
            <FilterPanel brands={brands} bodyTypes={bodyTypes} brand={brand} bodyType={bodyType} setBrand={selectBrand} setBodyType={selectBodyType} reset={reset} />
            <button type="button" onClick={() => {
              syncUrl()
              setMobileFiltersOpen(false)
            }} className="sticky bottom-0 mt-4 min-h-14 w-full bg-brand px-5 text-sm font-extrabold uppercase tracking-[0.12em] text-ink shadow-[0_-16px_30px_var(--paper)] hover:bg-brand-deep hover:text-white">
              Show {filtered.length} {filtered.length === 1 ? "vehicle" : "vehicles"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
