'use client'

import { ScrubNumberField } from '@youj/react'

export default function ScrubNumberFieldPair() {
  return (
    <div className="grid w-full max-w-xs grid-cols-2 gap-1.5">
      <ScrubNumberField aria-label="X" label="X" size="sm" defaultValue={12} />
      <ScrubNumberField aria-label="Y" label="Y" size="sm" defaultValue={-4} />
      <ScrubNumberField aria-label="Rotation" label="↻" size="sm" defaultValue={0} min={-180} max={180} unit="°" />
      <ScrubNumberField aria-label="Opacity" label="α" size="sm" defaultValue={0.5} min={0} max={1} step={0.1} />
    </div>
  )
}
