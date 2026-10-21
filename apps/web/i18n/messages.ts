import type { Locale } from "next-intl"

/**
 * A language's messages, from its folder in `messages/`: `main.json` holds
 * most namespaces, and each other file is one namespace of its own, kept
 * apart so the browser can load it alone (the error page loads only
 * `errors.json`; next-intl's "split messages"). A new namespace file is
 * added here and in global.d.ts.
 */
export async function loadMessages(locale: Locale) {
  const [main, errors] = await Promise.all([
    import(`../messages/${locale}/main.json`),
    import(`../messages/${locale}/errors.json`),
  ])
  return { ...main.default, errors: errors.default }
}
