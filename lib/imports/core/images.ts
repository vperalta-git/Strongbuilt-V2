import { existsSync } from "node:fs"
import { resolve } from "node:path"

export function optimizedLocalImagePath(suggestedPath: string) {
  return suggestedPath.replace(/\.[a-z0-9]+$/i, ".webp")
}

export function publicImageFilePath(publicPath: string) {
  return resolve("public", publicPath.replace(/^\/+/, ""))
}

export function existingLocalImagePath(suggestedPath?: string) {
  if (!suggestedPath?.startsWith("/")) return undefined
  const optimizedPath = optimizedLocalImagePath(suggestedPath)
  if (existsSync(publicImageFilePath(optimizedPath))) return optimizedPath
  if (existsSync(publicImageFilePath(suggestedPath))) return suggestedPath
  return undefined
}
