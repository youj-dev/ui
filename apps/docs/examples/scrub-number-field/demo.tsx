'use client'

import { useState } from 'react'
import { ScrubNumberField } from '@youj/react'

export default function ScrubNumberFieldDemo() {
  const [blur, setBlur] = useState(24)
  return (
    <div className="flex w-full max-w-xs flex-col items-start gap-4">
      <div className="w-40">
        <ScrubNumberField aria-label="Blur" label="B" unit="px" min={0} max={100} value={blur} onValueChange={setBlur} />
      </div>
      <div className="h-16 w-full rounded-lg bg-accent" style={{ filter: `blur(${blur / 8}px)` }} aria-hidden />
    </div>
  )
}
