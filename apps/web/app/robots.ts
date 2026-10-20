import type { MetadataRoute } from "next"

import { SITE_URL } from "@/lib/site"

// Everything public may be crawled. Pages behind sign-in set
// `robots: { index: false }` in their own metadata.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  }
}
