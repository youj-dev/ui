'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, FilterChips } from '@youj/react'

const FIELDS = ['label', 'priority', 'assignee', 'repo']

function checkFilter(token: string) {
  const field = /^([a-z]+):\S/.exec(token)?.[1]
  if (!field) return 'Write a filter as field:value, e.g. assignee:me.'
  if (!FIELDS.includes(field)) return `There’s no ${field} filter. Try ${FIELDS.join(', ')}.`
}

export default function FilterChipsDemo() {
  const [query, setQuery] = useState(['label:bug', 'priority:in(p1,p2)'])

  return (
    <Field className="w-full max-w-lg">
      <FieldLabel>Issues</FieldLabel>
      <FilterChips value={query} onValueChange={setQuery} validate={checkFilter} />
      <FieldDescription>Type assignee:me and a space. Click a chip to edit it.</FieldDescription>
    </Field>
  )
}
