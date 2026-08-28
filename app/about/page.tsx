import type { Metadata } from "next"

import { AboutPageContent } from "@/components/sections/about-page-content"
import { siteConfig } from "@/config/site"

const title = "About"
const description =
  "Learn how Strongbuilt approaches commercial truck sourcing, body requirements, and vehicle configuration for Philippine business operations."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title: `${title} | ${siteConfig.name}`,
    description,
    type: "website",
    url: "/about",
  },
}

export default function AboutPage() {
  return <AboutPageContent />
}
