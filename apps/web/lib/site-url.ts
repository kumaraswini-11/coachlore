import "server-only"

/**
 * The site's address, for canonical URLs, link previews, robots and the
 * sitemap, with no trailing slash. In order: `NEXT_PUBLIC_SITE_URL` if set;
 * on Vercel, the production address in production and the deployment's own
 * address in a preview (Vercel's system variables, available at build and at
 * runtime); otherwise the local address. Spec 000, "The site's address".
 */
export function siteUrl(
  env: Readonly<Record<string, string | undefined>> = process.env
): string {
  const override = env.NEXT_PUBLIC_SITE_URL
  if (override) {
    return override.replace(/\/+$/, "")
  }

  if (env.VERCEL_ENV === "production" && env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
  }

  if (env.VERCEL_ENV === "preview") {
    const host = env.VERCEL_BRANCH_URL || env.VERCEL_URL
    if (host) {
      return `https://${host}`
    }
  }

  return "http://localhost:3000"
}
