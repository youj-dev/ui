'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldGroup, FieldLabel, MultiLanguageInput } from '@youj/react'

const LOCALES = ['en', 'fr', 'de', 'ja', 'ar']

export default function MultiLanguageInputDemo() {
  const [name, setName] = useState<Record<string, string>>({
    en: 'Linen overshirt',
    fr: 'Surchemise en lin',
    ja: 'リネンオーバーシャツ',
  })
  const [description, setDescription] = useState<Record<string, string>>({
    en: 'Garment-dyed European linen with horn buttons. Relaxed through the body, cut to wear open over a tee.',
  })

  return (
    <FieldGroup className="w-full max-w-[30rem]">
      <Field required>
        <FieldLabel>Product name</FieldLabel>
        <MultiLanguageInput locales={LOCALES} value={name} onValueChange={setName} name="name" />
      </Field>
      <Field>
        <FieldLabel>Description</FieldLabel>
        <MultiLanguageInput locales={LOCALES} value={description} onValueChange={setDescription} multiline />
        <FieldDescription>Shown on the product page. Missing languages fall back to English.</FieldDescription>
      </Field>
    </FieldGroup>
  )
}
