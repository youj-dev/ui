'use client'

import { Field, FieldDescription, FieldLabel, TimePicker } from '@youj/react'

export default function TimePickerClocks() {
  return (
    <div className="flex w-full max-w-60 flex-col gap-6">
      <Field>
        <FieldLabel>Maintenance starts (UTC)</FieldLabel>
        <TimePicker hourCycle={24} defaultValue="02:00" step={5} />
        <FieldDescription>24-hour clock, 5-minute steps.</FieldDescription>
      </Field>
      <Field>
        <FieldLabel>Beginn</FieldLabel>
        <TimePicker locale="de-DE" defaultValue="14:45" />
        <FieldDescription>German locale: 24-hour by default.</FieldDescription>
      </Field>
    </div>
  )
}
