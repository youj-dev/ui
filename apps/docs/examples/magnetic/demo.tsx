'use client'

import { Magnetic, MagneticInner } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { Button } from '@youj/react'

export default function MagneticDemo() {
  return (
    <div className="flex w-full max-w-lg flex-col items-center text-center">
      <p className="text-2xl font-semibold tracking-tight text-balance text-fg">Ship your first preview in minutes.</p>
      <p className="mt-2 text-sm text-fg-muted">Connect a repository, and every push gets its own URL.</p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-8">
        {/* The shell follows the pointer; the label inside lags half as far, for depth. */}
        <Magnetic strength={0.22} radius={40}>
          <Button size="lg" className="px-5">
            <MagneticInner className="inline-flex items-center gap-2">
              Start deploying
              <ArrowRightIcon size={16} />
            </MagneticInner>
          </Button>
        </Magnetic>
        {/* The secondary action pulls less, so the primary one stays the stronger invitation. */}
        <Magnetic strength={0.12} radius={40}>
          <Button size="lg" variant="outline" className="px-5">
            <MagneticInner>Talk to sales</MagneticInner>
          </Button>
        </Magnetic>
      </div>
    </div>
  )
}
