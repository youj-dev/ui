'use client'

import { Field, FieldDescription, FieldLabel } from '@youj/react'
import { MultiSelect, type MultiSelectOption } from '@youj/react/command'

function Dot({ className }: { className: string }) {
  return <span aria-hidden className={`size-2 rounded-full ${className}`} />
}

const LABELS: MultiSelectOption[] = [
  { value: 'bug', label: 'Bug', icon: <Dot className="bg-danger" /> },
  { value: 'feature', label: 'Feature', icon: <Dot className="bg-accent" /> },
  { value: 'perf', label: 'Performance', icon: <Dot className="bg-warning" /> },
  { value: 'docs', label: 'Documentation', icon: <Dot className="bg-success" /> },
  { value: 'design', label: 'Design', icon: <Dot className="bg-fg-muted" /> },
  { value: 'infra', label: 'Infrastructure', icon: <Dot className="bg-fg-subtle" /> },
]

export default function MultiSelectMaxCount() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Labels</FieldLabel>
      <MultiSelect options={LABELS} defaultValue={['bug', 'perf']} maxCount={3} placeholder="Add labels" searchPlaceholder="Search labels…" />
      <FieldDescription>Up to three per issue.</FieldDescription>
    </Field>
  )
}
