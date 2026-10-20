'use client'

import { useState } from 'react'
import { Field, FieldDescription, FieldLabel, TimePicker } from '@youj/react'

export default function TimePickerDemo() {
  const [time, setTime] = useState<string | null>('09:30')

  return (
    <Field className="w-full max-w-60">
      <FieldLabel>Daily standup</FieldLabel>
      {/* A fixed locale renders the same AM/PM words on the server and in the browser. */}
      <TimePicker value={time} onValueChange={setTime} step={15} hourCycle={12} locale="en-US" />
      <FieldDescription>{time ? `Stored as ${time}. ` : ''}Quarter-hour steps.</FieldDescription>
    </Field>
  )
}
