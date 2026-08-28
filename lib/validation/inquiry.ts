import { z } from "zod"

export const inquirySchema = z
  .object({
    name: z.string().trim().min(2, "Please enter your full name.").max(120),
    company: z.string().trim().max(160).optional().default(""),
    email: z.email("Please enter a valid email address.").max(180),
    phone: z.string().trim().min(7, "Please enter a valid phone number.").max(60),
    preferredContact: z.enum(["phone", "email", "either"]),
    selectedTruck: z.string().trim().max(180).optional().default(""),
    truckRequirement: z.string().trim().max(500).optional().default(""),
    intendedApplication: z.string().trim().max(240).optional().default(""),
    message: z.string().trim().max(3000).optional().default(""),
    source: z.enum(["quote", "contact"]),
    website: z.string().max(0).optional().default(""),
  })
  .superRefine((data, context) => {
    if (data.source === "quote" && !data.truckRequirement && !data.selectedTruck) {
      context.addIssue({
        code: "custom",
        path: ["truckRequirement"],
        message: "Tell us which truck or body requirement you are considering.",
      })
    }

    if (data.source === "contact" && !data.message) {
      context.addIssue({
        code: "custom",
        path: ["message"],
        message: "Please include a short message.",
      })
    }
  })

export type ValidatedInquiry = z.infer<typeof inquirySchema>
