'use client'

import type { ComponentType } from 'react'
import { Marquee } from '@youj/motion'
import { CompassIcon, GlobeIcon, LayersIcon, PuzzleIcon, SnowflakeIcon, SparklesIcon, type IconProps } from '@youj/icons'

const CUSTOMERS: [string, ComponentType<IconProps>][] = [
  ['Northwind', LayersIcon],
  ['Halcyon', GlobeIcon],
  ['Vertex', CompassIcon],
  ['Orbital', SnowflakeIcon],
  ['Quanta', PuzzleIcon],
  ['Lumen', SparklesIcon],
]

export default function MarqueeFade() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      {[0, 48, 96].map((fade) => (
        <figure key={fade} className="flex flex-col gap-2">
          {/* The same row each time, in a frame. Only the width of the faded edges changes. */}
          <div className="overflow-hidden rounded-xl border border-line bg-surface py-3">
            <Marquee aria-hidden fade={fade} gap={32} speed={28}>
              {CUSTOMERS.map(([name, Icon]) => (
                <span key={name} className="flex items-center gap-1.5 text-fg-muted">
                  <Icon size={16} strokeWidth={1.75} />
                  <span className="text-sm font-semibold tracking-tight">{name}</span>
                </span>
              ))}
            </Marquee>
          </div>
          <figcaption className="font-mono text-xs text-fg-muted">
            {`fade={${fade}}`}
            {fade === 48 && ' · default'}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
