'use client'

import { Atmosphere } from '@youj/motion/backgrounds'

// Five colors in the scene's own order (sandstone: light, mid, shadow, deep, rim). Tokens keep them in your theme.
const COLORS = ['var(--color-surface)', 'var(--color-chart-4)', 'var(--color-accent)', 'var(--color-chart-2)', 'var(--color-canvas)']

export default function AtmosphereColors() {
  return (
    <div className="relative isolate min-h-[320px] w-full overflow-hidden rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <Atmosphere scene="sandstone" colors={COLORS} />
    </div>
  )
}
