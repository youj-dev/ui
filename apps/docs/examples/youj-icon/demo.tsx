'use client'

import {
  ArrowRight,
  Bell,
  Box,
  Check,
  Cloud,
  Coins,
  Download,
  Eraser,
  Hand,
  Heart,
  HeartPulse,
  ListChecks,
  Orbit,
  PenLine,
  Radio,
  RefreshCw,
  Route,
  Search,
  Stamp,
  Tag,
  TriangleAlert,
  ZoomIn,
  type LucideIcon,
} from 'lucide-react'
import { YoujIcon, type YoujIconEffect } from '@youj/icons'

// One lucide icon per effect, picked so the motion reads as what the icon means.
const EFFECTS: [YoujIconEffect, LucideIcon][] = [
  ['pop', Heart],
  ['wiggle', Hand],
  ['spin', RefreshCw],
  ['nudge', ArrowRight],
  ['pulse', Radio],
  ['ring', Bell],
  ['bounce', Download],
  ['flip', Coins],
  ['swing', Tag],
  ['float', Cloud],
  ['heartbeat', HeartPulse],
  ['shake', TriangleAlert],
  ['jelly', Box],
  ['orbit', Orbit],
  ['tilt', Search],
  ['zoom-in', ZoomIn],
  ['zoom-out', Stamp],
  ['draw', PenLine],
  ['draw-in', Check],
  ['draw-out', Eraser],
  ['draw-sequence', Route],
  ['stagger-draw', ListChecks],
]

export default function YoujIconDemo() {
  return (
    <div className="@container w-full max-w-2xl">
      <div className="grid grid-cols-3 gap-2 @md:grid-cols-4 @xl:grid-cols-6">
        {EFFECTS.map(([effect, Icon]) => (
          <button
            key={effect}
            type="button"
            className="flex h-22 flex-col items-center justify-center gap-2.5 rounded-xl border border-line bg-surface text-fg transition-colors yj-duration-fast ease-standard hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            {/* draw-in rests undrawn, so it keeps its default mount trigger here and plays as the grid appears. */}
            <YoujIcon icon={Icon} effect={effect} trigger={effect === 'draw-in' ? 'mount' : 'hover'} size={24} strokeWidth={1.5} />
            <span className="font-mono text-[11px] text-fg-muted">{effect}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
