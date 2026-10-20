'use client'

import { Field, FieldDescription, FieldLabel, InputOTP } from '@youj/react'

export default function InputOTPLengths() {
  return (
    <div className="flex max-w-full min-w-0 flex-col gap-6">
      <Field className="w-fit">
        <FieldLabel>PIN</FieldLabel>
        <InputOTP length={4} defaultValue="12" />
      </Field>
      <Field className="w-fit">
        <FieldLabel>Email code</FieldLabel>
        <InputOTP groups={[3, 3]} defaultValue="4829" />
      </Field>
      <Field className="w-fit">
        <FieldLabel>Recovery code</FieldLabel>
        {/* Letters and digits, upper-cased as they're typed or pasted. */}
        <InputOTP mode="alphanumeric" length={8} groups={[4, 4]} defaultValue="A7C9" />
        <FieldDescription>From the backup codes you saved when you turned on 2FA.</FieldDescription>
      </Field>
    </div>
  )
}
