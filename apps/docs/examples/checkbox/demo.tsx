'use client'

import { useState } from 'react'
import { Checkbox, Field, FieldContent, FieldDescription, FieldLabel, FieldLegend, FieldSet } from '@youj/react'

const TOPICS = [
  { id: 'mentions', label: 'Mentions', description: 'Someone mentions you or replies to your thread.' },
  { id: 'deployments', label: 'Failed deployments', description: 'A production or preview build fails.' },
  { id: 'domains', label: 'Domains', description: 'A certificate renews or a DNS record changes.' },
  { id: 'billing', label: 'Billing', description: 'Invoices, usage alerts and plan changes.' },
]

export default function CheckboxDemo() {
  const [on, setOn] = useState(['mentions', 'deployments'])
  const all = on.length === TOPICS.length
  const some = on.length > 0 && !all

  return (
    <div className="w-full max-w-md rounded-xl border border-line bg-surface p-5">
      <FieldSet>
        <FieldLegend>Email notifications</FieldLegend>
        {/* The parent is mixed while only some topics are on. Ticking it turns them all on. */}
        <Field orientation="horizontal" className="border-b border-line pb-4">
          <Checkbox checked={all} indeterminate={some} onCheckedChange={(next) => setOn(next ? TOPICS.map((t) => t.id) : [])} />
          <FieldLabel>Everything</FieldLabel>
        </Field>
        {TOPICS.map((topic) => (
          <Field key={topic.id} orientation="horizontal">
            <Checkbox
              checked={on.includes(topic.id)}
              onCheckedChange={(next) => setOn((current) => (next ? [...current, topic.id] : current.filter((id) => id !== topic.id)))}
            />
            <FieldContent>
              <FieldLabel>{topic.label}</FieldLabel>
              <FieldDescription>{topic.description}</FieldDescription>
            </FieldContent>
          </Field>
        ))}
      </FieldSet>
    </div>
  )
}
