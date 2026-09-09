export const officialSiteUrl = "https://www.strongbuilt.com.ph"

export function resolveSiteUrl(configuredUrl = process.env.NEXT_PUBLIC_SITE_URL) {
  if (!configuredUrl?.trim()) return officialSiteUrl

  try {
    const url = new URL(configuredUrl.trim())
    if (url.protocol !== "http:" && url.protocol !== "https:") return officialSiteUrl

    const official = new URL(officialSiteUrl)
    const officialApex = official.hostname.replace(/^www\./, "")
    if (url.hostname === officialApex || url.hostname === official.hostname || url.hostname.endsWith(".vercel.app")) {
      return officialSiteUrl
    }

    return url.origin
  } catch {
    return officialSiteUrl
  }
}

export const siteConfig = {
  name: "Strongbuilt",
  legalName: "Strongbuilt Motors and Equipment Inc.",
  description:
    "Commercial trucks, truck-body solutions, and fleet-focused vehicle configuration for Philippine businesses.",
  url: resolveSiteUrl(),
  locale: "en_PH",
  contact: {
    phoneDisplay: "+63 (917) 891-3681",
    phoneHref: "+639178913681",
    email: "sales@strongbuilt.com.ph",
    addressLines: [
      "4th Floor, Unit 405, Mercedes Plaza I",
      "Mercedes Avenue corner Luis Street",
      "Barangay San Miguel",
      "Pasig City 1600",
      "Philippines",
    ],
    hours: "Monday to Friday, 9:00 AM–6:00 PM PHT",
  },
  social: {
    facebook: "",
    messenger: "",
    linkedin: "",
  },
  nav: [
    { label: "Home", href: "/" },
    { label: "Trucks", href: "/trucks" },
    { label: "Industries", href: "/industries" },
    { label: "Services", href: "/services" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
} as const

export const absoluteUrl = (path = "/") => new URL(path, siteConfig.url).toString()
