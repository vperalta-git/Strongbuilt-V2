import { closeManufacturerCommandConnection, runManufacturerCommand, type ManufacturerCommandMode } from "@/lib/imports/core/runner"

function parseArguments(argv: string[]) {
  const manufacturer = argv.find((argument) => !argument.startsWith("-"))
  if (!manufacturer) throw new Error("Provide a manufacturer slug, for example: isuzu.")
  let models: string[] | undefined
  let apply = false
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === manufacturer) continue
    if (argument === "--apply") {
      apply = true
      continue
    }
    if (argument === "--models") {
      const value = argv[index + 1]
      if (!value || value.startsWith("--")) throw new Error("--models requires a comma-separated value.")
      models = value.split(",").map((model) => model.trim()).filter(Boolean)
      index += 1
      continue
    }
    if (argument.startsWith("--models=")) {
      models = argument.slice("--models=".length).split(",").map((model) => model.trim()).filter(Boolean)
      continue
    }
    throw new Error(`Unsupported argument: ${argument}.`)
  }
  return { manufacturer, models, apply }
}

export async function runCli(mode: ManufacturerCommandMode) {
  const options = parseArguments(process.argv.slice(2))
  try {
    await runManufacturerCommand({ mode, ...options })
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : "Unknown manufacturer importer failure."
    const uri = process.env.MONGODB_URI
    console.error(uri ? rawMessage.replaceAll(uri, "[redacted]") : rawMessage)
    process.exitCode = 1
  } finally {
    await closeManufacturerCommandConnection()
  }
}
