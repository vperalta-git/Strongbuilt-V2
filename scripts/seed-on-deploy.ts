import { runSeed } from "@/scripts/seed"

async function main() {
  if (process.env.VERCEL !== "1" || process.env.VERCEL_ENV !== "production") {
    console.log("Strongbuilt database seed: skipped outside Vercel production.")
    return
  }

  console.log("Strongbuilt database seed: starting production synchronization.")
  await runSeed({ loadEnvironment: false })
}

main().catch((error: unknown) => {
  const rawMessage = error instanceof Error ? error.message : "Unknown seed failure."
  const uri = process.env.MONGODB_URI
  const safeMessage = uri ? rawMessage.replaceAll(uri, "[redacted]") : rawMessage
  console.error(`Production seed failed: ${safeMessage}`)
  process.exitCode = 1
})
