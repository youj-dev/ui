'use client'

import { Field, FieldLabel, SignaturePad } from '@youj/react'

export default function SignaturePadTypeInstead() {
  return (
    <Field className="w-full max-w-lg">
      <FieldLabel>Signature</FieldLabel>
      <SignaturePad className="border-0 shadow-none [--signature-inset:0px]" defaultValue={{ kind: 'typed', text: 'Dana Whitfield' }} />
    </Field>
  )
}
