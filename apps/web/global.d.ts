import type { routing } from "@/i18n/routing"
import type errors from "@/messages/en/errors.json"
import type main from "@/messages/en/main.json"

// Typed languages and message keys for next-intl, from the routing and the
// English messages, the source (next-intl's TypeScript docs). The files are
// merged as i18n/messages.ts merges them.
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number]
    Messages: typeof main & { errors: typeof errors }
  }
}
