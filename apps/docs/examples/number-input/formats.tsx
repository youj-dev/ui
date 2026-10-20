'use client'

import { Field, FieldDescription, FieldLabel, NumberInput } from '@youj/react'

export default function NumberInputFormats() {
  return (
    <div className="grid w-full max-w-lg gap-6 sm:grid-cols-2">
      <Field>
        <FieldLabel>Discount</FieldLabel>
        {/* 0.15 shows as 15%, and steps of 0.05 move it by 5%. */}
        <NumberInput defaultValue={0.15} min={0} max={1} step={0.05} format={{ style: 'percent' }} />
      </Field>
      <Field>
        <FieldLabel>Memory</FieldLabel>
        <NumberInput defaultValue={4} min={1} max={64} format={{ style: 'unit', unit: 'gigabyte' }} />
      </Field>
      <Field>
        <FieldLabel>Rate limit</FieldLabel>
        <NumberInput defaultValue={120} min={10} max={1000} step={10} unit="req/min" />
      </Field>
      <Field>
        <FieldLabel>Seats</FieldLabel>
        <NumberInput defaultValue={1} min={1} max={5} />
        <FieldDescription>Up to five seats on this plan.</FieldDescription>
      </Field>
    </div>
  )
}
