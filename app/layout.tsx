import type { Metadata } from "next"
import { Barlow_Condensed, Manrope } from "next/font/google"
import "./globals.css"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { absoluteUrl, siteConfig } from "@/config/site"

const displayFont = Barlow_Condensed({
  variable: "--font-display-face",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  display: "swap",
})

const bodyFont = Manrope({
  variable: "--font-body-face",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Strongbuilt | Commercial Trucks & Fleet Solutions",
    template: "%s | Strongbuilt",
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: "Strongbuilt | Commercial Trucks & Fleet Solutions",
    description: siteConfig.description,
    url: "/",
    images: [{ url: "/images/editorial/industrial-worksite.png", width: 1672, height: 941, alt: "Industrial operations supported by Strongbuilt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Strongbuilt | Commercial Trucks & Fleet Solutions",
    description: siteConfig.description,
    images: ["/images/editorial/industrial-worksite.png"],
  },
  robots: { index: true, follow: true },
}

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.legalName,
  url: siteConfig.url,
  logo: absoluteUrl("/images/brand/strongbuilt-logo.png"),
  email: siteConfig.contact.email,
  telephone: siteConfig.contact.phoneDisplay,
  address: {
    "@type": "PostalAddress",
    streetAddress: "4th Floor, Unit 405, Mercedes Plaza I, Mercedes Avenue corner Luis Street",
    addressLocality: "Pasig City",
    postalCode: "1600",
    addressCountry: "PH",
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        <SiteHeader />
        <main id="main-content">{children}</main>
        <SiteFooter />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replace(/</g, "\\u003c") }}
        />
      </body>
    </html>
  )
}
