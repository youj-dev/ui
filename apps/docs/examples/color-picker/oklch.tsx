'use client'

import { useState } from 'react'
import { ColorPicker, type Swatch } from '@youj/react'

const LABEL_COLORS: Swatch[] = [
  { value: 'oklch(0.72 0.15 158)', label: 'Mint' },
  { value: 'oklch(0.79 0.14 72)', label: 'Amber' },
  { value: 'oklch(0.68 0.18 24)', label: 'Coral' },
  { value: 'oklch(0.62 0.21 330)', label: 'Orchid' },
  { value: '#111111', label: 'Ink' },
]

export default function ColorPickerOklch() {
  const [value, setValue] = useState('oklch(0.72 0.15 158)')

  return (
    <div className="flex flex-col items-start gap-3">
      <ColorPicker value={value} onValueChange={setValue} format="oklch" swatches={LABEL_COLORS} aria-label="Label color" />
      <code className="font-mono text-ui-sm text-fg-muted">{value}</code>
    </div>
  )
}
