'use client'

import type { ReactNode } from 'react'
import { Field, FieldContent, FieldDescription, FieldLabel } from '../../../components/ui/field'
import { Input } from '../../../components/ui/input'
import { Switch } from '../../../components/ui/switch'
import type { SurveyBuilderCopy } from './data'

/* The editor's small fields: a switch on a row with what it does, a labelled
 * field, and the words at a scale's two ends. */

/** A switch with its label and what it does, on one row. */
export function SettingRow({
  label,
  hint,
  checked,
  onChange,
  children,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (on: boolean) => void
  children?: ReactNode
}) {
  return (
    <Field orientation="horizontal" className="items-start">
      <FieldContent>
        <FieldLabel className="font-normal">{label}</FieldLabel>
        {hint && <FieldDescription>{hint}</FieldDescription>}
        {children}
      </FieldContent>
      <Switch checked={checked} onCheckedChange={onChange} />
    </Field>
  )
}

export function Labelled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Field className="min-w-0 flex-1">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </Field>
  )
}

/** The words at a scale's two ends. */
export function EndLabels({
  labels,
  fallback,
  onChange,
  copy,
}: {
  labels?: [string, string]
  fallback: [string, string]
  onChange: (labels: [string, string] | undefined, key: string) => void
  copy: SurveyBuilderCopy
}) {
  const [low, high] = labels ?? ['', '']
  const set = (next: [string, string], key: string) => onChange(next[0] || next[1] ? next : undefined, key)
  return (
    <div className="flex flex-col gap-3 @md:flex-row">
      <Labelled label={copy.lowLabel}>
        <Input value={low} placeholder={fallback[0]} onChange={(e) => set([e.target.value, high], 'low')} />
      </Labelled>
      <Labelled label={copy.highLabel}>
        <Input value={high} placeholder={fallback[1]} onChange={(e) => set([low, e.target.value], 'high')} />
      </Labelled>
    </div>
  )
}
