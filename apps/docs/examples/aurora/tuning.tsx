'use client'

import { useState } from 'react'
import { Aurora } from '@youj/motion/backgrounds'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'

const HORIZONS: Record<string, number> = { Low: 0.35, Default: 0.58, High: 0.8 }

// Back layer to front. Token references follow the theme.
const PALETTES: Record<string, [string, string, string] | undefined> = {
  'Accent family': undefined,
  Status: ['var(--color-success)', 'var(--color-accent)', 'var(--color-warning)'],
}

function Setting({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <ToggleGroup variant="segmented" size="sm" aria-label={label} value={[value]} onValueChange={(next) => next[0] && onChange(next[0])}>
      {options.map((option) => (
        <ToggleGroupItem key={option} value={option} className="px-2.5 text-xs">
          {option}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export default function AuroraTuning() {
  const [horizon, setHorizon] = useState('Default')
  const [palette, setPalette] = useState('Accent family')

  return (
    <div className="mx-auto flex w-full max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-canvas sm:max-w-[calc(100%-4rem)]">
      <div className="relative isolate h-[260px] overflow-hidden">
        <Aurora horizon={HORIZONS[horizon]} colors={PALETTES[palette]} />
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-line bg-canvas px-4 py-3">
        <Setting label="Horizon" options={Object.keys(HORIZONS)} value={horizon} onChange={setHorizon} />
        <Setting label="Colors" options={Object.keys(PALETTES)} value={palette} onChange={setPalette} />
      </div>
    </div>
  )
}
