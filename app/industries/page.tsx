import type { Metadata } from "next"

import { IndustriesPageContent } from "@/components/sections/industries-page-content"
import { siteConfig } from "@/config/site"

const title = "Industries"
const description =
  "Commercial truck and body solutions shaped around logistics, construction, agriculture, cold-chain, manufacturing, and waste-management operations."

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/industries" },
  openGraph: {
    title: `${title} | ${siteConfig.name}`,
    description,
    type: "website",
    url: "/industries",
  },
}

export default function IndustriesPage() {
  return <IndustriesPageContent />
}
