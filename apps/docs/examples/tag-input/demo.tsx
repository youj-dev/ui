'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, TagInput } from '@youj/react'

function checkTopic(tag: string) {
  if (!/^[a-z0-9-]+$/.test(tag)) return 'Use lowercase letters, numbers and hyphens.'
  if (tag.length > 24) return 'Keep topics under 25 characters.'
}

export default function TagInputDemo() {
  const [topics, setTopics] = useState(['react', 'design-systems', 'motion'])

  return (
    <Field className="w-full max-w-sm">
      <FieldLabel>Topics</FieldLabel>
      <TagInput value={topics} onValueChange={setTopics} validate={checkTopic} maxTags={8} placeholder="Add a topic…" />
      <FieldDescription>Press Enter or comma to add. Try “motion” again, or “UI Kit”.</FieldDescription>
    </Field>
  )
}
