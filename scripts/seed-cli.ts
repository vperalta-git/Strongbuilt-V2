import { runSeed } from "@/scripts/seed"

runSeed().catch((error: unknown) => {
  const rawMessage = error instanceof Error ? error.message : "Unknown seed failure."
  const uri = process.env.MONGODB_URI
  const safeMessage = uri ? rawMessage.replaceAll(uri, "[redacted]") : rawMessage
  console.error(`Seed failed: ${safeMessage}`)
  process.exitCode = 1
})
