import type { ReactNode } from "react"

type SectionHeadingProps = {
  eyebrow: string
  title: ReactNode
  copy?: ReactNode
  theme?: "light" | "dark"
  align?: "left" | "center"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  copy,
  theme = "light",
  align = "left",
  className = "",
}: SectionHeadingProps) {
  const dark = theme === "dark"

  return (
    <div className={`${align === "center" ? "mx-auto text-center" : ""} ${className}`}>
      <div className={`mb-5 flex items-center gap-3 ${align === "center" ? "justify-center" : ""}`}>
        <span aria-hidden="true" className="h-[2px] w-8 bg-brand" />
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">{eyebrow}</p>
      </div>
      <h2
        className={`font-display text-[clamp(2.7rem,6vw,5.8rem)] font-bold uppercase leading-[0.88] tracking-[-0.03em] ${
          dark ? "text-white" : "text-ink"
        }`}
      >
        {title}
      </h2>
      {copy ? (
        <div className={`mt-6 max-w-2xl text-base leading-7 sm:text-lg ${dark ? "text-white/68" : "text-muted"}`}>
          {copy}
        </div>
      ) : null}
    </div>
  )
}
