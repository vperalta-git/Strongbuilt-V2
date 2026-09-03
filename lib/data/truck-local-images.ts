export const approvedLocalTruckImagePaths = {
  "isuzu-nmr85hs": "/images/trucks/isuzu/nmr85hs.webp",
  "isuzu-nqr75ls": "/images/trucks/isuzu/nqr75ls.webp",
  "isuzu-qlr77e": "/images/trucks/isuzu/qlr77e.webp",
  "isuzu-nlr85es": "/images/trucks/isuzu/nlr85es.webp",
  "isuzu-nlr77h": "/images/trucks/isuzu/nlr77h.webp",
  "isuzu-nlr85e": "/images/trucks/isuzu/nlr85e.webp",
  "isuzu-nmr85h": "/images/trucks/isuzu/nmr85h.webp",
  "isuzu-npr85k": "/images/trucks/isuzu/npr85k.webp",
} as const satisfies Record<string, string>

export function getApprovedLocalTruckImagePath(slug: string) {
  return approvedLocalTruckImagePaths[slug as keyof typeof approvedLocalTruckImagePaths]
}
