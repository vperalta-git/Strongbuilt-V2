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
  brand: "bg-brand text-white border-brand hover:bg-brand-deep hover:border-brand-deep",
  light: "bg-white text-ink border-white hover:bg-sail hover:border-sail",
  dark: "bg-ink text-white border-ink hover:bg-ink-soft hover:border-ink-soft",
  "outline-light": "bg-transparent text-white border-white/45 hover:border-brand hover:text-brand",
  "outline-dark": "bg-transparent text-ink border-ink/30 hover:border-brand hover:text-brand",
  text: "border-transparent bg-transparent text-current hover:text-brand",
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
      className={`group inline-flex items-center justify-center gap-3 border font-bold uppercase tracking-[0.12em] transition-colors duration-200 ${variants[variant]} ${sizes[size]} ${className}`}
    >
      <span>{children}</span>
      {showArrow ? (
        <ArrowUpRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      ) : null}
    </Link>
  )
}
