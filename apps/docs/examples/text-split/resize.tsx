'use client'

import { useState } from 'react'
import { TextSplit } from '@youj/motion'
import { Slider } from '@youj/react'

export default function TextSplitResize() {
  const [width, setWidth] = useState(100)

  return (
    <div className="w-full max-w-xl">
      <div className="mb-6 flex items-center gap-4">
        <span className="shrink-0 text-xs text-fg-muted">Column width</span>
        <Slider value={width} onValueChange={(v) => setWidth(v as number)} min={40} max={100} aria-label="Column width" />
        <span className="w-10 shrink-0 text-end font-mono text-xs text-fg-muted tabular-nums">{width}%</span>
      </div>
      <div style={{ width: `${width}%` }} className="rounded-xl border border-dashed border-line-strong p-5">
        {/* Lines are grouped from real layout. A new width regroups them in place, already settled. */}
        <TextSplit as="p" by="lines" mask inView={false} className="text-xl leading-snug font-medium tracking-tight text-fg">
          Measured from real layout, so the split always matches what you see, at any width and in any font.
        </TextSplit>
      </div>
    </div>
  )
}
