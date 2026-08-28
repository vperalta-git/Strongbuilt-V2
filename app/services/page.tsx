import type { Metadata } from "next"

import { ServicesPageContent } from "@/components/sections/services-page-content"
import { siteConfig } from "@/config/site"

const title = "Services"
const description =
  "Commercial truck sourcing, body solutions, fleet consultation, vehicle configuration, and sales coordination for business vehicle requirements."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/services" },
  openGraph: {
    title: `${title} | ${siteConfig.name}`,
    description,
    type: "website",
    url: "/services",
  },
}

export default function ServicesPage() {
  return <ServicesPageContent />
}
