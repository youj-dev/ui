'use client'

import { Tilt } from '@youj/motion'
import { RocketIcon } from '@youj/icons'

export default function TiltDepth() {
  return (
    <Tilt max={12} className="w-full max-w-xs rounded-2xl">
      {/* Tilt's inner layer preserves 3D. Keep preserving it on the way down, with no overflow clipping,
          and children can sit in front of the surface with translateZ. */}
      <div className="relative rounded-[inherit] border border-line bg-surface p-6 transform-3d">
        <div className="grid size-11 translate-z-12 place-items-center rounded-xl bg-accent text-on-accent shadow-lg">
          <RocketIcon size={20} />
        </div>
        <p className="mt-5 translate-z-6 text-lg font-semibold tracking-tight text-fg">Production is live</p>
        <p className="mt-1 translate-z-3 text-sm text-fg-muted">youj-web deployed to 18 regions in 42 seconds.</p>
      </div>
    </Tilt>
  )
}
