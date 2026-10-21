import { fill } from "@/i18n/error-messages"

/**
 * A count's words in a Client Component, which gets plain strings rather
 * than ICU messages (ADR 0008, "The browser"): one string per plural
 * category the language has, each with `{count}`. plural.test.ts checks
 * every such message has every category CLDR gives its language.
 */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string
}

export function plural(
  forms: PluralForms,
  count: number,
  locale: string
): string {
  const category = new Intl.PluralRules(locale).select(count)
  return fill(forms[category] ?? forms.other, {
    count: new Intl.NumberFormat(locale).format(count),
  })
}
