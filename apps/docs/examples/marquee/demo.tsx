'use client'

import { useState, type ComponentType } from 'react'
import { useYouj } from '@youj/core'
import { Marquee } from '@youj/motion'
import {
  CompassIcon,
  GaugeIcon,
  GlobeIcon,
  LayersIcon,
  PlayIcon,
  PuzzleIcon,
  RouteIcon,
  SnowflakeIcon,
  SparklesIcon,
  type IconProps,
} from '@youj/icons'

const CUSTOMERS: [string, ComponentType<IconProps>][] = [
  ['Northwind', LayersIcon],
  ['Halcyon', GlobeIcon],
  ['Vertex', CompassIcon],
  ['Orbital', SnowflakeIcon],
  ['Quanta', PuzzleIcon],
  ['Lumen', SparklesIcon],
  ['Parallel', RouteIcon],
  ['Cobalt', GaugeIcon],
]

function Logo({ name, Icon }: { name: string; Icon: ComponentType<IconProps> }) {
  return (
    <span className="flex items-center gap-2 text-fg-muted">
      <Icon size={22} strokeWidth={1.75} />
      <span className="text-lg font-semibold tracking-tight">{name}</span>
    </span>
  )
}

export default function MarqueeDemo() {
  const k = useYouj()
  const [paused, setPaused] = useState(false)
  const logos = CUSTOMERS.map(([name, Icon]) => <Logo key={name} name={name} Icon={Icon} />)

  return (
    <div className="w-full max-w-2xl">
      <div className="mb-6 flex min-h-7 items-center justify-between gap-4 px-1">
        <p className="text-sm text-fg-muted">Trusted by product teams at</p>
        {/* Moving content needs a way to stop it: speed 0 holds the rows where they are. */}
        {!k.reduced && (
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-fg-muted transition-colors duration-(--yj-duration-fast) ease-standard hover:bg-raised hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
          >
            <PlayIcon size={14} active={!paused} />
            {paused ? 'Play' : 'Pause'}
          </button>
        )}
      </div>
      <div className="space-y-6">
        <Marquee speed={paused ? 0 : 40} fade={64} gap={48}>
          {logos}
        </Marquee>
        {/* The second row repeats the first: hidden from assistive tech, and dropped when nothing moves. */}
        {!k.reduced && (
          <Marquee aria-hidden direction="right" speed={paused ? 0 : 32} fade={64} gap={48}>
            {[...logos].reverse()}
          </Marquee>
        )}
      </div>
    </div>
  )
}
