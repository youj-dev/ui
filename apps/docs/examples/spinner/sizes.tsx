'use client'

import { Spinner } from '@youj/react'

const SIZES = [12, 16, 20, 24, 32]

export default function SpinnerSizes() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-8">
      {SIZES.map((size) => (
        <figure key={size} className="flex flex-col items-center gap-3">
          {/* The stroke holds at 1.5px up to 24px, then grows with the ring. */}
          <Spinner size={size} label={null} />
          <figcaption className="font-mono text-xs text-fg-muted">{size}px</figcaption>
        </figure>
      ))}
      <figure className="flex flex-col items-center gap-3">
        <span className="grid size-8 place-items-center rounded-md bg-accent text-on-accent">
          <Spinner label={null} />
        </span>
        <figcaption className="font-mono text-xs text-fg-muted">on accent</figcaption>
      </figure>
      <figure className="flex flex-col items-center gap-3">
        <Spinner label={null} className="text-fg-muted" />
        <figcaption className="font-mono text-xs text-fg-muted">muted</figcaption>
      </figure>
    </div>
  )
}
