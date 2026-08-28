export const siteConfig = {
  name: "Strongbuilt",
  legalName: "Strongbuilt Motors and Equipment Inc.",
  description:
    "Commercial trucks, truck-body solutions, and fleet-focused vehicle configuration for Philippine businesses.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.strongbuilt.com.ph",
  locale: "en_PH",
  contact: {
    phoneDisplay: "+63 (917) 891-3681",
    phoneHref: "+639178913681",
    email: "sales@strongbuilt.com.ph",
    addressLines: [
      "4th Floor, Unit 405, Mercedes Plaza I",
      "Mercedes Avenue corner Luis Street",
      "Barangay San Miguel, Pasig City 1600",
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
