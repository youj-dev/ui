'use client'

import { Field, FieldDescription, FieldLabel, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@youj/react'

const EVENTS = [
  { value: 'deploy-failed', label: 'Failed deployments' },
  { value: 'deploy-promoted', label: 'Production promotions' },
  { value: 'domain-renewal', label: 'Domain renewals' },
  { value: 'usage-alert', label: 'Usage alerts' },
  { value: 'invoice', label: 'Invoices' },
  { value: 'member-joined', label: 'New teammates' },
]

// Two labels fit the trigger. Past that, name the first and count the rest.
function summarize(values: string[]) {
  const labels = EVENTS.filter((event) => values.includes(event.value)).map((event) => event.label)
  if (labels.length === 0) return 'Choose events'
  if (labels.length <= 2) return labels.join(', ')
  return `${labels[0]} and ${labels.length - 1} more`
}

export default function SelectMultiple() {
  return (
    <Field className="w-full max-w-xs">
      <FieldLabel>Email me about</FieldLabel>
      <Select items={EVENTS} multiple defaultValue={['deploy-failed', 'usage-alert']} name="notifications">
        <SelectTrigger className="w-full">
          <SelectValue>{(values: string[]) => summarize(values)}</SelectValue>
        </SelectTrigger>
        {/* Options toggle and the popup stays open, so it opens below the trigger rather than over it. */}
        <SelectContent alignItemWithTrigger={false}>
          {EVENTS.map((event) => (
            <SelectItem key={event.value} value={event.value}>
              {event.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>Sent to ana@youj.dev. Failed deployments also post to Slack.</FieldDescription>
    </Field>
  )
}
