import assert from "node:assert/strict"
import { absoluteUrl, officialSiteUrl, resolveSiteUrl, siteConfig } from "@/config/site"

assert.equal(officialSiteUrl, "https://www.strongbuilt.com.ph")
assert.equal(siteConfig.url, officialSiteUrl)
assert.equal(resolveSiteUrl("https://strongbuilt.com.ph"), officialSiteUrl)
assert.equal(resolveSiteUrl("http://strongbuilt.com.ph/path"), officialSiteUrl)
assert.equal(resolveSiteUrl("https://strongbuilt-v2.vercel.app"), officialSiteUrl)
assert.equal(resolveSiteUrl("https://preview-branch.vercel.app"), officialSiteUrl)
assert.equal(resolveSiteUrl("not a url"), officialSiteUrl)
assert.equal(resolveSiteUrl("http://localhost:3000/path"), "http://localhost:3000")
assert.equal(absoluteUrl("/trucks"), `${officialSiteUrl}/trucks`)

console.log(`Canonical site URL validation passed: ${officialSiteUrl}`)
