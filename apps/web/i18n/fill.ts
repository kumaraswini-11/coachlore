/**
 * A plain message with its `{name}` arguments filled in: what the Client
 * Components that read plain strings (the error pages, the Dex browser) use
 * in place of next-intl's ICU formatter (ADR 0008, "The browser").
 */
export function fill(message: string, values: Record<string, string>) {
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? (values[name] ?? match) : match
  )
}
