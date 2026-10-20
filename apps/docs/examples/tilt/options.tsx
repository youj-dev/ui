'use client'

import { Tilt } from '@youj/motion'

const TEMPLATES = [
  { name: 'Commerce starter', meta: 'Next.js · Stripe', max: 4, glare: false, scale: 1, spot: '20% 30%' },
  { name: 'Docs starter', meta: 'MDX · Search', max: 10, glare: true, scale: 1.03, spot: '75% 25%' },
]

export default function TiltOptions() {
  return (
    <div className="flex flex-wrap justify-center gap-8">
      {TEMPLATES.map(({ name, meta, max, glare, scale, spot }) => (
        <figure key={name} className="flex flex-col items-center gap-4">
          <Tilt max={max} glare={glare} scale={scale} className="rounded-xl">
            <div className="w-56 overflow-hidden rounded-[inherit] border border-line bg-surface">
              <div
                aria-hidden
                className="h-32 bg-raised"
                style={{ backgroundImage: `radial-gradient(80% 90% at ${spot}, color-mix(in oklch, var(--color-accent) 38%, transparent), transparent 70%)` }}
              />
              <div className="p-3.5">
                <p className="text-sm font-medium text-fg">{name}</p>
                <p className="text-xs text-fg-muted">{meta}</p>
              </div>
            </div>
          </Tilt>
          <figcaption className="font-mono text-xs text-fg-muted">
            max {max}
            {glare ? ` · glare · scale ${scale}` : ''}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
