'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, Input } from '@youj/react'

// Lowercase letters, numbers and single dashes, as a URL segment allows.
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+/, '')
    .slice(0, 32)

export default function InputControlled() {
  const [slug, setSlug] = useState('acme-web')

  return (
    <Field className="w-full max-w-sm">
      <FieldLabel>Project URL</FieldLabel>
      {/* onValueChange hands you the string. The value you pass back is what the input shows. */}
      <Input value={slug} onValueChange={(value) => setSlug(slugify(value))} spellCheck={false} className="font-mono text-ui-sm" />
      <FieldDescription>
        Deploys to <span className="font-medium text-fg">{slug.replace(/-+$/, '') || 'your-project'}.youj.app</span>
      </FieldDescription>
    </Field>
  )
}
