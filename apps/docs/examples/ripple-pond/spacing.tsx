'use client'

import { useState } from 'react'
import { RipplePond } from '@youj/motion/backgrounds'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'

type Pitch = '12' | '16' | '24'

export default function RipplePondSpacing() {
  const [value, setValue] = useState<Pitch>('16')

  return (
    <div className="mx-auto flex w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:max-w-[calc(100%-4rem)]">
      <div className="relative isolate h-[280px] overflow-hidden">
        <RipplePond spacing={Number(value)} />
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-line bg-canvas px-4 py-3">
        <span className="text-xs text-fg-muted">Spacing</span>
        <ToggleGroup
          variant="segmented"
          size="sm"
          aria-label="Spacing"
          value={[value]}
          onValueChange={(next) => next[0] && setValue(next[0] as Pitch)}
        >
          <ToggleGroupItem value="12" className="px-2.5 text-xs">
            12px
          </ToggleGroupItem>
          <ToggleGroupItem value="16" className="px-2.5 text-xs">
            16px
          </ToggleGroupItem>
          <ToggleGroupItem value="24" className="px-2.5 text-xs">
            24px
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
