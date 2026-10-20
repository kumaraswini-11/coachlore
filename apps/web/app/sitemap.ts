import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

// The public pages that exist today. Dex pages are added from the data once
// it exists.
const PATHS = ["/"]

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: new URL(path, SITE_URL).href }))
}
