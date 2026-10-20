'use client'

import type { ReactNode } from 'react'
import { Magnetic, MagneticInner } from '@youj/motion'
import { SendIcon } from '@youj/icons'

const shell =
  'inline-flex h-11 items-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-sm font-medium text-fg shadow-sm focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas focus-visible:outline-none'

function Specimen({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <figure className="flex flex-col items-center gap-4">
      <Magnetic strength={0.35} radius={56}>
        <button type="button" className={shell}>
          {children}
        </button>
      </Magnetic>
      <figcaption className="font-mono text-xs text-fg-muted">{caption}</figcaption>
    </figure>
  )
}

export default function MagneticDepth() {
  const label = (
    <>
      <SendIcon size={16} />
      Send invite
    </>
  )
  return (
    <div className="flex flex-wrap justify-center gap-x-10 gap-y-8">
      <Specimen caption="no inner">{label}</Specimen>
      <Specimen caption="ratio 0.5">
        <MagneticInner className="inline-flex items-center gap-2">{label}</MagneticInner>
      </Specimen>
      <Specimen caption="ratio 0.2">
        {/* The lower the ratio, the further the button slides beneath its label. */}
        <MagneticInner ratio={0.2} className="inline-flex items-center gap-2">
          {label}
        </MagneticInner>
      </Specimen>
    </div>
  )
}
