'use client'

import { useState } from 'react'
import { WarpGrid } from '@youj/motion/backgrounds'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'

type Depth = '0.6' | '1' | '1.8'

export default function WarpGridDepth() {
  const [value, setValue] = useState<Depth>('1')

  return (
    <div className="mx-auto flex w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:max-w-[calc(100%-4rem)]">
      <div className="relative isolate h-[280px] overflow-hidden">
        <WarpGrid depth={Number(value)} radius={200} />
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-line bg-canvas px-4 py-3">
        <span className="text-xs text-fg-muted">Depth</span>
        <ToggleGroup
          variant="segmented"
          size="sm"
          aria-label="Well depth"
          value={[value]}
          onValueChange={(next) => next[0] && setValue(next[0] as Depth)}
        >
          <ToggleGroupItem value="0.6" className="px-2.5 text-xs">
            Shallow
          </ToggleGroupItem>
          <ToggleGroupItem value="1" className="px-2.5 text-xs">
            Default
          </ToggleGroupItem>
          <ToggleGroupItem value="1.8" className="px-2.5 text-xs">
            Deep
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
