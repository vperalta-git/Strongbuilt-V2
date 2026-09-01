import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Strongbuilt Commercial Trucks",
    short_name: "Strongbuilt",
    description: "Commercial trucks, truck-body solutions, and fleet-focused vehicle configuration.",
    start_url: "/",
    display: "standalone",
    background_color: "#111210",
    theme_color: "#f15a22",
  }
}
