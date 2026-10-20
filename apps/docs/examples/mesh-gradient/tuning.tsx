'use client'

import { useState } from 'react'
import { MeshGradient } from '@youj/motion/backgrounds'

const INTENSITY = [0.4, 0.8, 1.2]
const GRAIN = [0, 0.5, 1]

function Choice({ label, values, value, onChange }: { label: string; values: number[]; value: number; onChange: (v: number) => void }) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 rounded-lg border border-line bg-surface/80 youj-allow-glass p-0.5 text-xs backdrop-blur">
      <span className="px-2 text-fg-muted">{label}</span>
      {values.map((v) => (
        <button
          key={v}
          type="button"
          aria-label={`${label} ${v}`}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className="rounded-md px-2 py-1 font-mono text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none aria-pressed:bg-raised aria-pressed:text-fg"
        >
          {v}
        </button>
      ))}
    </div>
  )
}

export default function MeshGradientTuning() {
  const [intensity, setIntensity] = useState(0.8)
  const [grain, setGrain] = useState(0.5)

  return (
    <div className="relative isolate flex min-h-[340px] w-full flex-col items-center justify-end gap-3 overflow-hidden p-5 rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <MeshGradient intensity={intensity} grain={grain} />
      {/* Content sits above the field: positioned, like the hero's headline. */}
      <p className="relative max-w-sm text-center text-sm text-fg">
        Below 1, the field leaves room for copy. Above it, the color is the point.
      </p>
      <div className="relative flex flex-wrap justify-center gap-2">
        <Choice label="intensity" values={INTENSITY} value={intensity} onChange={setIntensity} />
        <Choice label="grain" values={GRAIN} value={grain} onChange={setGrain} />
      </div>
    </div>
  )
}
