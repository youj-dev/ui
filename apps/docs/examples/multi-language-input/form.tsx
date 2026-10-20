'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { describeLocale, missingTranslations, MultiLanguageInput } from '@youj/react'
import { Form, FormField, FormSubmit } from '@youj/react/form'

const REQUIRED = ['en', 'de', 'fr']
const list = new Intl.ListFormat('en', { type: 'conjunction' })

const schema = z.object({
  // The message names the languages still missing: "Add the title in French."
  title: z.record(z.string(), z.string()).superRefine((value, ctx) => {
    const missing = missingTranslations(value, REQUIRED).map((code) => describeLocale(code, 'en').label)
    if (missing.length) ctx.addIssue({ code: 'custom', message: `Add the title in ${list.format(missing)}.` })
  }),
})

export default function MultiLanguageInputForm() {
  const form = useForm({ resolver: zodResolver(schema), defaultValues: { title: { en: 'Linen overshirt', de: 'Leinen-Overshirt' } } })
  return (
    <Form form={form} onSubmit={() => new Promise((resolve) => setTimeout(resolve, 800))} className="flex w-full max-w-sm flex-col gap-4">
      <FormField name="title" label="Title" required description="English, German and French are required to publish.">
        {(field) => (
          <MultiLanguageInput
            locales={['en', 'de', 'fr', 'ja']}
            requiredLocales={REQUIRED}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            ref={field.ref}
          />
        )}
      </FormField>
      <FormSubmit className="self-start">Save</FormSubmit>
    </Form>
  )
}
