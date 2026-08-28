import type { Metadata } from "next"
import { HomeHero } from "@/components/sections/home-hero"
import { HomeIntro } from "@/components/sections/home-intro"
import { FeaturedTrucks } from "@/components/sections/featured-trucks"
import { TruckTypesSection } from "@/components/sections/truck-types-section"
import { HomeIndustries } from "@/components/sections/home-industries"
import { HomeServices } from "@/components/sections/home-services"
import { WhyStrongbuilt } from "@/components/sections/why-strongbuilt"
import { BrandsSection } from "@/components/sections/brands-section"
import { FinalCta } from "@/components/sections/final-cta"
import { getFeaturedTrucks } from "@/lib/data/trucks"

export const revalidate = 300

export const metadata: Metadata = {
  title: "Commercial Trucks & Fleet Solutions",
  description: "Strongbuilt provides commercial truck sourcing, body solutions, and fleet-focused vehicle configuration for Philippine businesses.",
  alternates: { canonical: "/" },
}

export default async function HomePage() {
  const featuredTrucks = await getFeaturedTrucks(4)

  return (
    <>
      <HomeHero />
      <HomeIntro />
      <FeaturedTrucks trucks={featuredTrucks} />
      <TruckTypesSection />
      <HomeIndustries />
      <HomeServices />
      <WhyStrongbuilt />
      <BrandsSection />
      <FinalCta />
    </>
  )
}
