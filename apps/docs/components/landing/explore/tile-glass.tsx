'use client'

import { LiquidGlass } from '@youj/motion/interactions'
import { Demo } from './demo'

const button = 'inline-flex h-11 items-center rounded-full px-5 text-sm font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent'

/** Two glass buttons over big type and a stripe of color, so there's something to bend: they lean toward the pointer and squish when pressed. */
export default function GlassTile() {
  return (
    <Demo>
      <div className="relative grid h-44 w-full max-w-lg xl:h-48 place-items-center overflow-hidden rounded-xl border border-line bg-canvas">
        <div aria-hidden className="absolute inset-0 flex flex-col justify-center gap-1 select-none">
          <p className="whitespace-nowrap text-6xl font-bold tracking-tighter text-fg-subtle">Flow state, found.</p>
          <div className="h-5 bg-linear-to-r from-accent via-chart-4 to-chart-5" />
          <p className="whitespace-nowrap text-6xl font-bold tracking-tighter text-fg-subtle">Quiet by design.</p>
        </div>
        <div className="relative flex flex-wrap justify-center gap-3">
          <LiquidGlass className="rounded-full">
            <button type="button" className={button}>
              Start free
            </button>
          </LiquidGlass>
          <LiquidGlass className="rounded-full">
            <button type="button" className={button}>
              Watch the tour
            </button>
          </LiquidGlass>
        </div>
      </div>
    </Demo>
  )
}
