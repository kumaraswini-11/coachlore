import type { MetadataRoute } from "next"

import { SITE } from "@/lib/site"
import main from "@/messages/en/main.json"

// One manifest for the site; it opens at `/`, which the Proxy sends to the
// person's language.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: SITE.name,
    description: main.meta.description,
    lang: "en",
    dir: "ltr",
    start_url: "/",
    display: "standalone",
    background_color: SITE.colors.light,
    theme_color: SITE.colors.light,
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  }
}
