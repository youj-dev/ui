'use client'

import { useState } from 'react'
import { MagneticField } from '@youj/motion/backgrounds'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'

type Mode = 'repel' | 'attract'

export default function MagneticFieldPointer() {
  const [value, setValue] = useState<Mode>('repel')

  return (
    <div className="mx-auto flex w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:max-w-[calc(100%-4rem)]">
      <div className="relative isolate h-[280px] overflow-hidden">
        <MagneticField pointer={value} radius={110} />
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-line bg-canvas px-4 py-3">
        <span className="text-xs text-fg-muted">Pointer</span>
        <ToggleGroup
          variant="segmented"
          size="sm"
          aria-label="Pointer response"
          value={[value]}
          onValueChange={(next) => next[0] && setValue(next[0] as Mode)}
        >
          <ToggleGroupItem value="repel" className="px-2.5 text-xs">
            Repel
          </ToggleGroupItem>
          <ToggleGroupItem value="attract" className="px-2.5 text-xs">
            Attract
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
