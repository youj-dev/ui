'use client'

import { MeshGradient } from '@youj/motion/backgrounds'

// Any CSS colors work; tokens keep the field in step with the theme.
const COLORS = ['var(--color-success)', 'var(--color-accent)', 'var(--color-warning)', 'var(--color-success)']

export default function MeshGradientColors() {
  return (
    <div className="relative isolate min-h-[320px] w-full overflow-hidden rounded-2xl border border-line bg-canvas mx-auto max-w-[calc(100%-2rem)] sm:max-w-[calc(100%-4rem)]">
      <MeshGradient colors={COLORS} intensity={0.8} grain={0.35} />
    </div>
  )
}
