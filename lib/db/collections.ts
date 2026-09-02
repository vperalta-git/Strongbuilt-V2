import type { Db } from "mongodb"
import type {
  BrandDocument,
  IndustryDocument,
  InquiryDocument,
  QuoteRequestDocument,
  ServiceDocument,
  SiteSettingsDocument,
  TruckDocument,
  TruckTypeDocument,
} from "@/types/database"

export const collections = {
  brands: "brands",
  truckTypes: "truckTypes",
  trucks: "trucks",
  industries: "industries",
  services: "services",
  siteSettings: "siteSettings",
  inquiries: "inquiries",
  quoteRequests: "quoteRequests",
} as const

export const getBrandsCollection = (db: Db) => db.collection<BrandDocument>(collections.brands)
export const getTruckTypesCollection = (db: Db) => db.collection<TruckTypeDocument>(collections.truckTypes)
export const getTrucksCollection = (db: Db) => db.collection<TruckDocument>(collections.trucks)
export const getIndustriesCollection = (db: Db) => db.collection<IndustryDocument>(collections.industries)
export const getServicesCollection = (db: Db) => db.collection<ServiceDocument>(collections.services)
export const getSiteSettingsCollection = (db: Db) => db.collection<SiteSettingsDocument>(collections.siteSettings)
export const getInquiriesCollection = (db: Db) => db.collection<InquiryDocument>(collections.inquiries)
export const getQuoteRequestsCollection = (db: Db) => db.collection<QuoteRequestDocument>(collections.quoteRequests)
