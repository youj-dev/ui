'use client'

import { ImageCompare } from '@youj/react'

/* A dusk sky and the same sky graded, drawn as gradients in the theme's colors. */
function Sky({ graded }: { graded?: boolean }) {
  const top = graded ? 'var(--color-chart-4)' : 'var(--color-fg-subtle)'
  const mid = graded ? 'var(--color-accent)' : 'var(--color-fg-muted)'
  const low = graded ? 'var(--color-warning)' : 'var(--color-line-strong)'
  return (
    <div className="relative size-full" style={{ background: `linear-gradient(to bottom, ${top}, ${mid} 55%, ${low})` }}>
      <div className="absolute inset-x-0 bottom-0 h-1/3" style={{ background: `color-mix(in oklab, ${top} 40%, var(--color-canvas))` }} />
    </div>
  )
}

export default function ImageCompareVertical() {
  return (
    <div className="w-full max-w-xs p-4">
      <ImageCompare
        orientation="vertical"
        hover
        before={<Sky />}
        after={<Sky graded />}
        beforeLabel="Original"
        afterLabel="Graded"
        defaultValue={40}
        className="aspect-[3/4]"
      />
    </div>
  )
}
