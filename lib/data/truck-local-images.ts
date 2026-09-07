export const approvedLocalTruckImagePaths = {
  "isuzu-traviz-s": "/images/trucks/isuzu/traviz-s.webp",
  "isuzu-traviz-l": "/images/trucks/isuzu/traviz-l.webp",
  "isuzu-nmr85hs": "/images/trucks/isuzu/nmr85hs.webp",
  "isuzu-nqr75ls": "/images/trucks/isuzu/nqr75ls.webp",
  "isuzu-qlr77e": "/images/trucks/isuzu/qlr77e.webp",
  "isuzu-nlr85es": "/images/trucks/isuzu/nlr85es.webp",
  "isuzu-nlr77h": "/images/trucks/isuzu/nlr77h.webp",
  "isuzu-nlr85e": "/images/trucks/isuzu/nlr85e.webp",
  "isuzu-nmr85h": "/images/trucks/isuzu/nmr85h.webp",
  "isuzu-npr85k": "/images/trucks/isuzu/npr85k.webp",
  "isuzu-nqr75l": "/images/trucks/isuzu/nqr75l.webp",
  "isuzu-frr90m": "/images/trucks/isuzu/frr90m.webp",
  "isuzu-ftr90m": "/images/trucks/isuzu/ftr90m.webp",
  "isuzu-fvr34q": "/images/trucks/isuzu/fvr34q.webp",
  "isuzu-fvm34w": "/images/trucks/isuzu/fvm34w.webp",
  "isuzu-fvm34t": "/images/trucks/isuzu/fvm34t.webp",
  "isuzu-fxm60w": "/images/trucks/isuzu/fxm60w.webp",
  "isuzu-fvr34qs": "/images/trucks/isuzu/fvr34qs.webp",
  "isuzu-frr90ms": "/images/trucks/isuzu/frr90ms.webp",
  "isuzu-fvz34": "/images/trucks/isuzu/fvz34.webp",
  "isuzu-gxz60n-tractor-head": "/images/trucks/isuzu/gxz60n.webp",
  "isuzu-traviz-puv": "/images/trucks/isuzu/traviz-puv.webp",
  "isuzu-nlr77-puv": "/images/trucks/isuzu/nlr77-puv.webp",
  "isuzu-npr85-puv": "/images/trucks/isuzu/npr85-puv.webp",
  "isuzu-nqr-bus": "/images/trucks/isuzu/nqr-bus.webp",
  "isuzu-fvr-bus": "/images/trucks/isuzu/fvr-bus.webp",
} as const satisfies Record<string, string>

export function getApprovedLocalTruckImagePath(slug: string) {
  return approvedLocalTruckImagePaths[slug as keyof typeof approvedLocalTruckImagePaths]
}
