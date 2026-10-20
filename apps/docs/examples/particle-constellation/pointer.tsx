'use client'

import { useState } from 'react'
import { ParticleConstellation } from '@youj/motion/backgrounds'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'

type Mode = 'attract' | 'repel'

export default function ParticleConstellationPointer() {
  const [mode, setMode] = useState<Mode>('attract')

  return (
    <div className="mx-auto flex w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:max-w-[calc(100%-4rem)]">
      <div className="relative isolate h-[280px] overflow-hidden">
        <ParticleConstellation pointer={mode} density={1.6} linkDistance={110} />
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-line bg-canvas px-4 py-3">
        <span className="text-xs text-fg-muted">Pointer</span>
        <ToggleGroup
          variant="segmented"
          size="sm"
          aria-label="Pointer response"
          value={[mode]}
          onValueChange={(next) => next[0] && setMode(next[0] as Mode)}
        >
          <ToggleGroupItem value="attract" className="px-2.5 text-xs">
            Attract
          </ToggleGroupItem>
          <ToggleGroupItem value="repel" className="px-2.5 text-xs">
            Repel
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
    </div>
  )
}
