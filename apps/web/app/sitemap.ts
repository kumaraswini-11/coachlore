import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/site-url"

// The public pages that exist today. Dex pages are added from the data once
// it exists.
const PATHS = ["/"]

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: new URL(path, siteUrl()).href }))
}
