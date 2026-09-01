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
  brand: "border-brand bg-brand text-ink hover:border-brand-deep hover:bg-brand-deep hover:text-white",
  light: "border-paper bg-paper text-ink hover:border-sail hover:bg-sail hover:text-ink",
  dark: "border-ink bg-ink text-white hover:border-brand hover:bg-brand hover:text-ink",
  "outline-light": "border-white/55 bg-transparent text-white hover:border-white hover:bg-white hover:text-ink",
  "outline-dark": "border-ink/40 bg-transparent text-ink hover:border-ink hover:bg-ink hover:text-white",
  text: "border-transparent bg-transparent text-ink hover:text-brand-deep",
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
