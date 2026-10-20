'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, TagInput } from '@youj/react'

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export default function TagInputEmails() {
  const [emails, setEmails] = useState(['mara@northwind.dev', 'ilya@northwind.dev', 'sol@kestrel.studio'])
  return (
    <Field className="w-full max-w-md">
      <FieldLabel>Invite by email</FieldLabel>
      <TagInput
        value={emails}
        onValueChange={setEmails}
        validate={(tag) => (isEmail(tag) ? undefined : `“${tag}” isn’t an email address.`)}
        maxTags={10}
        name="invite"
        placeholder="name@company.com"
      />
      <FieldDescription>Press Enter after each one, or paste a list. Up to 10 at a time.</FieldDescription>
    </Field>
  )
}
