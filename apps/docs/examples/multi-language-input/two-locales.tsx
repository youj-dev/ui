'use client'

import { Field, FieldDescription, FieldLabel, MultiLanguageInput } from '@youj/react'

export default function MultiLanguageInputTwoLocales() {
  return (
    <Field required className="w-full max-w-sm">
      <FieldLabel>Welcome message</FieldLabel>
      <MultiLanguageInput locales={['en', 'fr']} defaultValue={{ en: 'Welcome back' }} />
      <FieldDescription>Open French to copy the English in, then translate it.</FieldDescription>
    </Field>
  )
}
