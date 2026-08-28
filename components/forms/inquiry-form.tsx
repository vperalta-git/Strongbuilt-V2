"use client"

import { AlertCircle, CheckCircle2, LoaderCircle, Send } from "lucide-react"
import Link from "next/link"
import type { FormEvent } from "react"
import { useRef, useState } from "react"

import { inquirySchema, type ValidatedInquiry } from "@/lib/validation/inquiry"

type InquiryFormProps = {
  variant: "quote" | "contact"
  initialSelectedTruck?: {
    slug: string
    label: string
  } | null
}

type Feedback = {
  kind: "idle" | "submitting" | "success" | "warning" | "error"
  message: string
}

type FieldErrors = Partial<Record<keyof ValidatedInquiry, string>>

type InquiryApiResponse = {
  message?: string
  stored?: boolean
  field?: string
}

type EmailDelivery = "not-configured" | "sent" | "failed"

const emailJsConfig = {
  serviceId: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
  templateId: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
  publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY || "",
}

const inputBase =
  "min-h-13 w-full rounded-sm border bg-paper px-4 py-3 text-sm text-ink outline-none transition-[border-color,box-shadow,background-color] placeholder:text-muted/55 hover:border-ink/35 focus:border-brand focus:bg-white focus:ring-2 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"

const getFormValue = (data: FormData, name: string) => {
  const value = data.get(name)
  return typeof value === "string" ? value : ""
}

async function sendWithEmailJs(payload: ValidatedInquiry): Promise<EmailDelivery> {
  if (!emailJsConfig.serviceId || !emailJsConfig.templateId || !emailJsConfig.publicKey) {
    return "not-configured"
  }

  try {
    const { send } = await import("@emailjs/browser")

    await send(
      emailJsConfig.serviceId,
      emailJsConfig.templateId,
      {
        name: payload.name,
        from_name: payload.name,
        company: payload.company,
        email: payload.email,
        reply_to: payload.email,
        phone: payload.phone,
        preferred_contact: payload.preferredContact,
        selected_truck: payload.selectedTruck,
        truck_requirement: payload.truckRequirement,
        intended_application: payload.intendedApplication,
        message: payload.message,
        inquiry_source: payload.source,
        submitted_at: new Date().toISOString(),
      },
      { publicKey: emailJsConfig.publicKey },
    )

    return "sent"
  } catch (error) {
    console.error("EmailJS inquiry delivery failed", error)
    return "failed"
  }
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null

  return (
    <p id={id} className="mt-2 flex items-start gap-2 text-xs font-semibold leading-5 text-error">
      <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
      {message}
    </p>
  )
}

export function InquiryForm({ variant, initialSelectedTruck }: InquiryFormProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [feedback, setFeedback] = useState<Feedback>({ kind: "idle", message: "" })
  const isQuote = variant === "quote"
  const isSubmitting = feedback.kind === "submitting"
  const idPrefix = isQuote ? "quote" : "contact"

  const focusField = (field?: string) => {
    if (!field) return
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus()
    })
  }

  const handleChange = (event: FormEvent<HTMLFormElement>) => {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    if (!target.name || !fieldErrors[target.name as keyof ValidatedInquiry]) return

    setFieldErrors((current) => ({ ...current, [target.name]: undefined }))
  }

  const showSuccess = (message: string) => {
    formRef.current?.reset()
    setFieldErrors({})
    setFeedback({ kind: "success", message })
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) return

    const formData = new FormData(event.currentTarget)
    const parsed = inquirySchema.safeParse({
      name: getFormValue(formData, "name"),
      company: getFormValue(formData, "company"),
      email: getFormValue(formData, "email"),
      phone: getFormValue(formData, "phone"),
      preferredContact: getFormValue(formData, "preferredContact"),
      selectedTruck: getFormValue(formData, "selectedTruck"),
      truckRequirement: getFormValue(formData, "truckRequirement"),
      intendedApplication: getFormValue(formData, "intendedApplication"),
      message: getFormValue(formData, "message"),
      source: variant,
      website: getFormValue(formData, "website"),
    })

    if (!parsed.success) {
      const nextErrors: FieldErrors = {}

      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof ValidatedInquiry | undefined
        if (field && !nextErrors[field]) nextErrors[field] = issue.message
      }

      const firstField = parsed.error.issues[0]?.path[0]?.toString()
      setFieldErrors(nextErrors)
      setFeedback({ kind: "error", message: "Please review the highlighted fields and try again." })
      focusField(firstField)
      return
    }

    setFieldErrors({})
    setFeedback({ kind: "submitting", message: "Sending your inquiry…" })

    let response: Response

    try {
      response = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      })
    } catch {
      const emailDelivery = await sendWithEmailJs(parsed.data)

      if (emailDelivery === "sent") {
        showSuccess("Your inquiry has been sent to the Strongbuilt sales team.")
      } else {
        setFeedback({
          kind: "error",
          message: "We could not send your inquiry right now. Please call or email the sales team instead.",
        })
      }
      return
    }

    const result = (await response.json().catch(() => ({}))) as InquiryApiResponse

    if (!response.ok) {
      if (response.status === 400) {
        const field = result.field as keyof ValidatedInquiry | undefined
        if (field) setFieldErrors({ [field]: result.message || "Please review this field." })
        setFeedback({ kind: "error", message: result.message || "Please review the inquiry details." })
        focusField(result.field)
        return
      }

      const emailDelivery = await sendWithEmailJs(parsed.data)
      if (emailDelivery === "sent") {
        showSuccess("Your inquiry has been sent to the Strongbuilt sales team.")
      } else {
        setFeedback({
          kind: "error",
          message: result.message || "We could not send your inquiry right now. Please call or email the sales team instead.",
        })
      }
      return
    }

    const emailDelivery = await sendWithEmailJs(parsed.data)

    if (result.stored) {
      showSuccess(result.message || "Your inquiry has been received.")
      return
    }

    if (emailDelivery === "sent") {
      showSuccess("Your inquiry has been sent to the Strongbuilt sales team.")
      return
    }

    if (emailDelivery === "failed") {
      setFeedback({
        kind: "error",
        message: "Your details were validated, but delivery could not be completed. Please call or email the sales team.",
      })
      return
    }

    setFeedback({
      kind: "warning",
      message:
        result.message ||
        "This form is not connected for delivery in the current environment. Please call or email the sales team.",
    })
  }

  const errorClass = (field: keyof ValidatedInquiry) =>
    fieldErrors[field] ? "border-error focus:border-error focus:ring-error/15" : "border-line"

  return (
    <form
      ref={formRef}
      noValidate
      onSubmit={handleSubmit}
      onChange={handleChange}
      aria-busy={isSubmitting}
      className="relative"
    >
      <div aria-hidden="true" className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${idPrefix}-website`}>Leave this field empty</label>
        <input
          id={`${idPrefix}-website`}
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <fieldset disabled={isSubmitting} className="space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor={`${idPrefix}-name`} className="mb-2.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
              Full name <span className="text-brand" aria-hidden="true">*</span>
            </label>
            <input
              id={`${idPrefix}-name`}
              name="name"
              type="text"
              required
              maxLength={120}
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? `${idPrefix}-name-error` : undefined}
              className={`${inputBase} ${errorClass("name")}`}
              placeholder="Your full name"
            />
            <FieldError id={`${idPrefix}-name-error`} message={fieldErrors.name} />
          </div>

          <div>
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <label htmlFor={`${idPrefix}-company`} className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">Company</label>
              <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted">Optional</span>
            </div>
            <input
              id={`${idPrefix}-company`}
              name="company"
              type="text"
              maxLength={160}
              autoComplete="organization"
              aria-invalid={Boolean(fieldErrors.company)}
              aria-describedby={fieldErrors.company ? `${idPrefix}-company-error` : undefined}
              className={`${inputBase} ${errorClass("company")}`}
              placeholder="Business or organization"
            />
            <FieldError id={`${idPrefix}-company-error`} message={fieldErrors.company} />
          </div>

          <div>
            <label htmlFor={`${idPrefix}-email`} className="mb-2.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
              Email address <span className="text-brand" aria-hidden="true">*</span>
            </label>
            <input
              id={`${idPrefix}-email`}
              name="email"
              type="email"
              required
              maxLength={180}
              autoComplete="email"
              inputMode="email"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? `${idPrefix}-email-error` : undefined}
              className={`${inputBase} ${errorClass("email")}`}
              placeholder="name@company.com"
            />
            <FieldError id={`${idPrefix}-email-error`} message={fieldErrors.email} />
          </div>

          <div>
            <label htmlFor={`${idPrefix}-phone`} className="mb-2.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
              Phone number <span className="text-brand" aria-hidden="true">*</span>
            </label>
            <input
              id={`${idPrefix}-phone`}
              name="phone"
              type="tel"
              required
              minLength={7}
              maxLength={60}
              autoComplete="tel"
              inputMode="tel"
              aria-invalid={Boolean(fieldErrors.phone)}
              aria-describedby={fieldErrors.phone ? `${idPrefix}-phone-error` : undefined}
              className={`${inputBase} ${errorClass("phone")}`}
              placeholder="Your best contact number"
            />
            <FieldError id={`${idPrefix}-phone-error`} message={fieldErrors.phone} />
          </div>
        </div>

        <fieldset>
          <legend className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
            Preferred contact method <span className="text-brand" aria-hidden="true">*</span>
          </legend>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
            {[
              ["phone", "Phone"],
              ["email", "Email"],
              ["either", "Either works"],
            ].map(([value, label]) => (
              <label key={value} className="inline-flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold text-ink/75">
                <input
                  type="radio"
                  name="preferredContact"
                  value={value}
                  defaultChecked={value === "either"}
                  className="size-4.5 accent-brand"
                />
                {label}
              </label>
            ))}
          </div>
          <FieldError id={`${idPrefix}-preferred-contact-error`} message={fieldErrors.preferredContact} />
        </fieldset>

        {isQuote ? (
          <div className="space-y-6 border-y border-line py-8">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <label htmlFor={`${idPrefix}-selected-truck`} className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">Specific truck or model</label>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted">If known</span>
                </div>
                <input
                  id={`${idPrefix}-selected-truck`}
                  name="selectedTruck"
                  type="text"
                  maxLength={180}
                  defaultValue={initialSelectedTruck?.label || ""}
                  aria-invalid={Boolean(fieldErrors.selectedTruck)}
                  aria-describedby={fieldErrors.selectedTruck ? `${idPrefix}-selected-truck-error` : initialSelectedTruck ? `${idPrefix}-selected-truck-note` : undefined}
                  className={`${inputBase} ${errorClass("selectedTruck")}`}
                  placeholder="Brand and model"
                />
                {initialSelectedTruck ? (
                  <p id={`${idPrefix}-selected-truck-note`} className="mt-2 text-xs leading-5 text-muted">
                    Preselected from the truck catalog. You can edit this field if needed.
                  </p>
                ) : null}
                <FieldError id={`${idPrefix}-selected-truck-error`} message={fieldErrors.selectedTruck} />
              </div>

              <div>
                <div className="mb-2.5 flex items-center justify-between gap-3">
                  <label htmlFor={`${idPrefix}-application`} className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">Intended application</label>
                  <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted">Optional</span>
                </div>
                <input
                  id={`${idPrefix}-application`}
                  name="intendedApplication"
                  type="text"
                  maxLength={240}
                  aria-invalid={Boolean(fieldErrors.intendedApplication)}
                  aria-describedby={fieldErrors.intendedApplication ? `${idPrefix}-application-error` : undefined}
                  className={`${inputBase} ${errorClass("intendedApplication")}`}
                  placeholder="e.g. Regional cargo delivery"
                />
                <FieldError id={`${idPrefix}-application-error`} message={fieldErrors.intendedApplication} />
              </div>
            </div>

            <div>
              <label htmlFor={`${idPrefix}-requirement`} className="mb-2.5 block text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
                Truck or body requirement <span className="text-brand" aria-hidden="true">*</span>
              </label>
              <textarea
                id={`${idPrefix}-requirement`}
                name="truckRequirement"
                rows={4}
                maxLength={500}
                aria-invalid={Boolean(fieldErrors.truckRequirement)}
                aria-describedby={`${idPrefix}-requirement-hint${fieldErrors.truckRequirement ? ` ${idPrefix}-requirement-error` : ""}`}
                className={`${inputBase} min-h-32 resize-y ${errorClass("truckRequirement")}`}
                placeholder="Tell us the truck type, body, quantity, payload, route, or other requirements you already know."
              />
              <p id={`${idPrefix}-requirement-hint`} className="mt-2 text-xs leading-5 text-muted">
                Required when no specific truck or model is entered.
              </p>
              <FieldError id={`${idPrefix}-requirement-error`} message={fieldErrors.truckRequirement} />
            </div>
          </div>
        ) : null}

        <div>
          <div className="mb-2.5 flex items-center justify-between gap-3">
            <label htmlFor={`${idPrefix}-message`} className="text-xs font-extrabold uppercase tracking-[0.12em] text-ink">
              {isQuote ? "Additional details" : "How can we help?"} {!isQuote ? <span className="text-brand" aria-hidden="true">*</span> : null}
            </label>
            {isQuote ? <span className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-muted">Optional</span> : null}
          </div>
          <textarea
            id={`${idPrefix}-message`}
            name="message"
            rows={isQuote ? 5 : 7}
            required={!isQuote}
            maxLength={3000}
            aria-invalid={Boolean(fieldErrors.message)}
            aria-describedby={fieldErrors.message ? `${idPrefix}-message-error` : undefined}
            className={`${inputBase} min-h-36 resize-y ${errorClass("message")}`}
            placeholder={isQuote ? "Add questions, timing, preferred configuration, or other context." : "Share your question or commercial vehicle requirement."}
          />
          <FieldError id={`${idPrefix}-message-error`} message={fieldErrors.message} />
        </div>

        <div className="border-t border-line pt-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-lg text-xs leading-5 text-muted">
              Strongbuilt will use these details to respond to your inquiry. See the{" "}
              <Link href="/privacy" className="font-bold text-ink underline decoration-line underline-offset-2 transition-colors hover:text-brand">
                privacy notice
              </Link>
              . No account is required.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-sm bg-brand px-7 py-4 text-sm font-extrabold uppercase tracking-[0.1em] text-white transition-colors hover:bg-brand-deep disabled:cursor-wait disabled:opacity-70"
            >
              {isSubmitting ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="size-4" />
              )}
              {isSubmitting ? "Sending…" : isQuote ? "Send quote request" : "Send message"}
            </button>
          </div>

          {feedback.kind !== "idle" && feedback.kind !== "submitting" ? (
            <div
              role={feedback.kind === "error" ? "alert" : "status"}
              aria-live="polite"
              className={`mt-6 flex items-start gap-3 rounded-sm border px-4 py-4 text-sm font-semibold leading-6 ${
                feedback.kind === "success"
                  ? "border-success/25 bg-success/8 text-success"
                  : feedback.kind === "warning"
                    ? "border-brand/30 bg-brand/8 text-ink"
                    : "border-error/25 bg-error/8 text-error"
              }`}
            >
              {feedback.kind === "success" ? (
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              ) : (
                <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          ) : null}

          {feedback.kind === "submitting" ? (
            <p role="status" aria-live="polite" className="sr-only">{feedback.message}</p>
          ) : null}
        </div>
      </fieldset>
    </form>
  )
}
