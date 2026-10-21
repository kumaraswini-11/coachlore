import type { MetadataRoute } from "next"

import { siteUrl } from "@/lib/site-url"

// Everything public may be crawled. Pages behind sign-in set
// `robots: { index: false }` in their own metadata.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: new URL("/sitemap.xml", siteUrl()).href,
  }
}
