'use client'

import { LiquidGlass } from '@youj/motion/interactions'
import { Aurora } from '@youj/motion/backgrounds'

const button =
  'inline-flex h-11 items-center rounded-full px-5 text-sm font-medium text-fg outline-none focus-visible:ring-2 focus-visible:ring-accent'

export default function LiquidGlassDemo() {
  return (
    <div className="relative grid min-h-[420px] w-full place-items-center overflow-hidden rounded-xl bg-canvas">
      <Aurora className="absolute inset-0" />
      <div className="relative flex flex-col items-center gap-7 px-6 text-center">
        <p className="max-w-sm text-2xl font-semibold tracking-tight text-balance text-fg">Your work, in one calm place</p>
        <div className="flex flex-wrap justify-center gap-3">
          {/* The radius goes on LiquidGlass, so the glass takes it. */}
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
    </div>
  )
}
