import { NextResponse } from "next/server"
import { inquirySchema } from "@/lib/validation/inquiry"
import { saveInquiry } from "@/lib/data/inquiries"

export async function POST(request: Request) {
  try {
    const parsed = inquirySchema.safeParse(await request.json())

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: parsed.error.issues[0]?.message || "Please review the inquiry details.",
          field: parsed.error.issues[0]?.path[0],
        },
        { status: 400 },
      )
    }

    const result = await saveInquiry(parsed.data)

    return NextResponse.json(
      {
        message: result.stored
          ? "Your inquiry has been received."
          : "Your inquiry was validated. Connect MongoDB or EmailJS to deliver production inquiries.",
        stored: result.stored,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Unable to process inquiry", error)
    return NextResponse.json(
      { message: "We could not submit your inquiry right now. Please call or email the sales team." },
      { status: 500 },
    )
  }
}
