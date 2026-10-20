'use client'

import { Field, FieldDescription, FieldLabel, MultiLanguageInput } from '@youj/react'

// Forty locales a global storefront ships in; English is the source.
const LOCALES = [
  'en', 'en-GB', 'fr', 'fr-CA', 'de', 'es', 'es-419', 'it', 'pt-BR', 'pt-PT',
  'nl', 'sv', 'da', 'nb', 'fi', 'pl', 'cs', 'sk', 'hu', 'ro',
  'bg', 'el', 'tr', 'uk', 'ru', 'ar', 'he', 'fa', 'hi', 'bn',
  'th', 'vi', 'id', 'ms', 'fil', 'ja', 'ko', 'zh-Hans', 'zh-Hant', 'sw',
]

const translated = Object.fromEntries(LOCALES.slice(1, 31).filter((_, i) => i % 6 !== 2).map((code) => [code, `Summer sale (${code})`]))

export default function MultiLanguageInputManyLocales() {
  return (
    <Field required className="w-full max-w-[32rem]">
      <FieldLabel>Campaign headline</FieldLabel>
      <MultiLanguageInput locales={LOCALES} pinned={['en', 'de', 'fr', 'ja']} defaultValue={{ ...translated, en: 'Summer sale: 30% off linen' }} />
      <FieldDescription>Search by name, native name or code: “Deutsch”, “pt-br”, “Brazil”. ⌥⌘↓ jumps to the next language left to translate.</FieldDescription>
    </Field>
  )
}
