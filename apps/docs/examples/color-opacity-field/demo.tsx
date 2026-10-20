'use client'

import { useState } from 'react'
import { ColorOpacityField, type ColorOpacityValue } from '@youj/react'

export default function ColorOpacityFieldDemo() {
  const [value, setValue] = useState<ColorOpacityValue>({ color: '#4c6fff', opacity: 80 })
  return (
    <div className="flex w-full max-w-xs flex-col gap-3">
      <ColorOpacityField value={value} onValueChange={setValue} />
      <div className="h-12 rounded-lg" style={{ background: `color-mix(in srgb, ${value.color} ${value.opacity}%, transparent)` }} />
    </div>
  )
}
