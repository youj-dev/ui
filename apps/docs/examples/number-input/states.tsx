'use client'

import { Field, FieldError, FieldLabel, NumberInput } from '@youj/react'

export default function NumberInputStates() {
  return (
    <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <Field invalid required>
        <FieldLabel>Replicas</FieldLabel>
        <NumberInput min={1} max={20} placeholder="1–20" />
        <FieldError>Run at least one replica.</FieldError>
      </Field>
      <Field disabled>
        <FieldLabel>Concurrency</FieldLabel>
        <NumberInput defaultValue={8} />
      </Field>
      <Field>
        <FieldLabel>Betrag</FieldLabel>
        {/* Reads and shows “1.234,50 €”, whatever the browser's locale. */}
        <NumberInput locale="de-DE" defaultValue={1234.5} step={0.5} format={{ style: 'currency', currency: 'EUR' }} />
      </Field>
      <Field>
        <FieldLabel>Build timeout</FieldLabel>
        <NumberInput defaultValue={15} min={1} max={60} unit="min" steppers={false} />
      </Field>
    </div>
  )
}
