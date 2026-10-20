'use client'

import { useState } from 'react'
import { ColorPicker, Field, FieldDescription, FieldLabel } from '@youj/react'

export default function ColorPickerDemo() {
  const [color, setColor] = useState('#3554fc')

  return (
    <div className="flex w-full max-w-xs flex-col gap-4">
      <Field>
        <FieldLabel>Brand color</FieldLabel>
        <ColorPicker value={color} onValueChange={setColor} aria-label="Brand color" />
        <FieldDescription>Used for buttons, links and focus rings.</FieldDescription>
      </Field>
      <div className="flex items-center gap-3 rounded-lg border border-line p-3">
        <span className="rounded-md px-3 py-1.5 text-ui font-medium text-[white]" style={{ backgroundColor: color }}>
          Preview
        </span>
        <span className="text-ui" style={{ color }}>
          A link in your color
        </span>
      </div>
    </div>
  )
}
