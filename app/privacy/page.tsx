import type { Metadata } from "next"
import { Container } from "@/components/ui/container"

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Strongbuilt handles information submitted through this website.",
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <section className="bg-paper pb-24 pt-40 lg:pt-48">
      <Container className="max-w-4xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-brand">Website information</p>
        <h1 className="mt-5 font-display text-6xl font-bold uppercase leading-[0.9] sm:text-8xl">Privacy notice</h1>
        <div className="mt-10 space-y-7 border-t border-line pt-8 text-base leading-8 text-muted">
          <p>
            Strongbuilt uses the information you submit through contact and quotation forms to respond to your inquiry, understand your commercial vehicle requirement, and coordinate with relevant sales personnel.
          </p>
          <p>
            Submitted information may include your name, company, contact details, intended application, selected vehicle, and message. Strongbuilt retains inquiry information only as needed to respond, coordinate the request, and meet applicable operational or legal requirements.
          </p>
          <p>
            To request access to, correction of, or deletion of information submitted through this website, contact the Strongbuilt sales team using the details on the Contact page.
          </p>
          <p>
            For questions about information submitted through this website, contact the Strongbuilt sales team using the details on the Contact page.
          </p>
          <p>
            Strongbuilt does not sell inquiry information. Service providers used to operate the website or deliver messages may process information only for those purposes and under the applicable service terms.
          </p>
        </div>
      </Container>
    </section>
  )
}
