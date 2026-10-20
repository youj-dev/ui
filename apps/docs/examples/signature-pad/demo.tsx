'use client'

import { Field, FieldDescription, SignaturePad, type SignatureValue } from '@youj/react'

/** Stands in for your upload: the Accept button waits for it. */
async function fileSignature(_signature: SignatureValue) {
  await new Promise((resolve) => setTimeout(resolve, 900))
}

export default function SignaturePadDemo() {
  return (
    <Field className="w-full max-w-lg">
      <SignaturePad className="border-0 shadow-none [--signature-inset:0px]" onAccept={fileSignature} />
      <FieldDescription>Dana Whitfield, Head of Operations. Accepting files the signature with the agreement.</FieldDescription>
    </Field>
  )
}
