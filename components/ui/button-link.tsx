import Link from "next/link"
import type { ReactNode } from "react"
import { ArrowUpRight } from "lucide-react"

type ButtonLinkProps = {
  href: string
  children: ReactNode
  variant?: "brand" | "light" | "dark" | "outline-light" | "outline-dark" | "text"
  size?: "sm" | "md" | "lg"
  className?: string
  showArrow?: boolean
}

const variants = {
  brand: "border-accent bg-accent text-text-on-orange hover:border-accent-hover hover:bg-accent-hover hover:text-text-on-dark",
  light: "border-surface-light bg-surface-light text-text-on-light hover:border-surface-cream hover:bg-surface-cream hover:text-text-on-light",
  dark: "border-surface-dark bg-surface-dark text-text-on-dark hover:border-accent hover:bg-accent hover:text-text-on-orange",
  "outline-light": "border-white/55 bg-transparent text-text-on-dark hover:border-white hover:bg-white hover:text-text-on-light",
  "outline-dark": "border-ink/40 bg-transparent text-text-on-light hover:border-surface-dark hover:bg-surface-dark hover:text-text-on-dark",
  text: "border-transparent bg-transparent text-text-on-light hover:text-brand-deep",
}

const sizes = {
  sm: "min-h-10 px-4 text-xs",
  md: "min-h-12 px-5 text-sm",
  lg: "min-h-14 px-6 text-sm sm:px-7",
}

export function ButtonLink({
  href,
  children,
  variant = "brand",
  size = "md",
  className = "",
  showArrow = true,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-3 border font-extrabold uppercase tracking-[0.13em] transition-colors duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      <span>{children}</span>
      {showArrow ? (
        <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      ) : null}
    </Link>
  )
}
