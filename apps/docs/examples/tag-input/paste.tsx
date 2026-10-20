'use client'

import { Field, FieldDescription, FieldLabel, TagInput } from '@youj/react'

export default function TagInputPaste() {
  return (
    <Field className="w-full max-w-sm">
      <FieldLabel>Allowed email domains</FieldLabel>
      <TagInput
        defaultValue={['orion.dev']}
        placeholder="Paste or type domains…"
        validate={(tag) => (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(tag) ? undefined : `“${tag}” isn’t a domain.`)}
      />
      <FieldDescription>Paste “acme.com, example.org, nope” to add several at once.</FieldDescription>
    </Field>
  )
}
