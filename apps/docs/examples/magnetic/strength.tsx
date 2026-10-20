'use client'

import { Magnetic, MagneticInner } from '@youj/motion'
import { PlusIcon } from '@youj/icons'

const RADIUS = 40
const STRENGTHS = [0.2, 0.35, 0.5]

export default function MagneticStrength() {
  return (
    <div className="flex flex-wrap justify-center gap-x-10 gap-y-8">
      {STRENGTHS.map((strength) => (
        <figure key={strength} className="flex flex-col items-center gap-5">
          <div className="relative flex" style={{ margin: RADIUS }}>
            {/* The dashed outline is where the pull begins: `radius` px beyond the element's box. */}
            <span
              aria-hidden
              className="pointer-events-none absolute border border-dashed border-line-strong"
              style={{ inset: -RADIUS, borderRadius: RADIUS }}
            />
            <Magnetic strength={strength} radius={RADIUS}>
              <button
                type="button"
                aria-label="New project"
                className="grid size-12 place-items-center rounded-full bg-accent text-on-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none"
              >
                <MagneticInner>
                  <PlusIcon size={20} strokeWidth={2} />
                </MagneticInner>
              </button>
            </Magnetic>
          </div>
          <figcaption className="font-mono text-xs text-fg-muted">strength {strength}</figcaption>
        </figure>
      ))}
    </div>
  )
}
