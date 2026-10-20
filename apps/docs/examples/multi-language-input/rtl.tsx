'use client'

import { Field, FieldGroup, FieldLabel, MultiLanguageInput } from '@youj/react'

const LOCALES = ['ar', 'he', 'en', 'fr']

export default function MultiLanguageInputRtl() {
  return (
    // An Arabic interface: the switcher mirrors, and each field runs in its own language's direction.
    <div dir="rtl" lang="ar" className="w-full max-w-[28rem]">
      <FieldGroup>
        <Field required>
          <FieldLabel>اسم المنتج</FieldLabel>
          <MultiLanguageInput locales={LOCALES} defaultValue={{ ar: 'قميص علوي من الكتان', en: 'Linen overshirt' }} />
        </Field>
        <Field>
          <FieldLabel>الوصف</FieldLabel>
          <MultiLanguageInput
            locales={LOCALES}
            multiline
            defaultValue={{ ar: 'كتان أوروبي بأزرار من القرن، يُرتدى مفتوحًا فوق قميص قطني.', he: 'פשתן אירופאי עם כפתורי קרן, ללבוש פתוח מעל חולצת טי.' }}
          />
        </Field>
      </FieldGroup>
    </div>
  )
}
