'use client'

import { useState } from 'react'
import { ScrubNumberField } from '@youj/react'
import { Demo, TileCard } from './demo'

/** A layer's position and size: press a letter and move sideways, or type; the box on the left follows. */
export default function ScrubTile() {
  const [box, setBox] = useState({ x: 24, y: 12, w: 40, h: 28 })
  const set = (key: keyof typeof box) => (value: number) => setBox((b) => ({ ...b, [key]: value }))
  return (
    <Demo>
      <TileCard className="max-w-md flex-row items-center gap-4 p-4">
        <div aria-hidden className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-band">
          <div className="absolute rounded-sm bg-accent" style={{ left: box.x, top: box.y, width: box.w, height: box.h }} />
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
          <ScrubNumberField aria-label="X" label="X" min={0} max={128} value={box.x} onValueChange={set('x')} size="sm" />
          <ScrubNumberField aria-label="Y" label="Y" min={0} max={96} value={box.y} onValueChange={set('y')} size="sm" />
          <ScrubNumberField aria-label="Width" label="W" min={8} max={128} value={box.w} onValueChange={set('w')} size="sm" />
          <ScrubNumberField aria-label="Height" label="H" min={8} max={96} value={box.h} onValueChange={set('h')} size="sm" />
        </div>
      </TileCard>
    </Demo>
  )
}
