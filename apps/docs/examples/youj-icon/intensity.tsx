'use client'

import { ArrowRight, Route, TriangleAlert, type LucideIcon } from 'lucide-react'
import { YoujIcon, type YoujIconEffect, type YoujIconIntensity } from '@youj/icons'

const LEVELS: YoujIconIntensity[] = ['subtle', 'default', 'strong']
const ROWS: { effect: YoujIconEffect; icon: LucideIcon; scales: string }[] = [
  { effect: 'shake', icon: TriangleAlert, scales: 'amplitude' },
  { effect: 'nudge', icon: ArrowRight, scales: 'travel' },
  { effect: 'draw-sequence', icon: Route, scales: 'pace' },
]

export default function IntensityTable() {
  return (
    <div className="w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface">
      <div className="grid grid-cols-[1.2fr_repeat(3,1fr)] border-b border-line text-xs text-fg-muted">
        <span className="px-4 py-2.5">Hover a cell</span>
        {LEVELS.map((level) => (
          <span key={level} className="px-2 py-2.5 text-center font-mono">
            {level}
          </span>
        ))}
      </div>
      {ROWS.map(({ effect, icon, scales }) => (
        <div key={effect} className="grid grid-cols-[1.2fr_repeat(3,1fr)] items-center border-b border-line last:border-b-0">
          <p className="px-4 py-3">
            <span className="block font-mono text-[13px] text-fg">{effect}</span>
            <span className="block text-xs text-fg-muted">scales its {scales}</span>
          </p>
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              aria-label={`${effect}, ${level}`}
              className="grid h-full min-h-14 place-items-center text-fg transition-colors yj-duration-fast ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none focus-visible:ring-inset"
            >
              <YoujIcon icon={icon} effect={effect} intensity={level} size={22} />
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
