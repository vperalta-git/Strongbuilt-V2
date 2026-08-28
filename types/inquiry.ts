export type PreferredContact = "phone" | "email" | "either"

export type InquiryInput = {
  name: string
  company?: string
  email: string
  phone: string
  preferredContact: PreferredContact
  selectedTruck?: string
  truckRequirement?: string
  intendedApplication?: string
  message?: string
  source: "quote" | "contact"
  website?: string
}

export type StoredInquiry = Omit<InquiryInput, "website"> & {
  _id?: string
  status: "new"
  createdAt: string
  updatedAt: string
}
