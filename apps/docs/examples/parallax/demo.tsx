'use client'

import { useRef, type CSSProperties } from 'react'
import { Parallax } from '@youj/motion'

// Each card drifts at its own depth: the larger the y range, the closer it feels.
const CARDS: { title: string; value: string; at: CSSProperties; y: number[]; rotate: number[] }[] = [
  { title: 'Deploys', value: '1,284', at: { insetInlineStart: '3%', top: '12%' }, y: [90, -90], rotate: [-4, 2] },
  { title: 'P95 latency', value: '84 ms', at: { insetInlineEnd: '3%', top: '6%' }, y: [160, -160], rotate: [3, -2] },
  { title: 'Error rate', value: '0.02%', at: { insetInlineEnd: '6%', top: '66%' }, y: [50, -50], rotate: [0, 0] },
  { title: 'Edge hits', value: '98.7%', at: { insetInlineStart: '6%', top: '70%' }, y: [200, -200], rotate: [2, -3] },
]

export default function ParallaxDemo() {
  const frame = useRef<HTMLDivElement>(null)

  return (
    <div
      ref={frame}
      role="region"
      aria-label="Observability"
      tabIndex={0}
      className="relative h-[340px] w-full max-w-2xl overflow-y-auto rounded-xl border border-line bg-canvas focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
    >
      <p className="px-5 pt-5 text-xs text-fg-muted">Scroll inside the frame</p>
      <section className="relative mt-16 mb-24 h-[520px] overflow-hidden">
        {/* The backdrop moves least, so it reads as the far plane. */}
        <Parallax
          container={frame}
          y={[-30, 30]}
          aria-hidden
          className="absolute -inset-y-10 inset-x-0 [background-image:radial-gradient(var(--color-line)_1px,transparent_1px)] [background-size:20px_20px]"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="font-mono text-xs tracking-[0.2em] text-accent uppercase">Observability</p>
          <p className="mt-3 max-w-[13rem] text-3xl font-semibold tracking-tight text-balance text-fg">Every request, in view.</p>
        </div>
        {CARDS.map(({ title, value, at, y, rotate }) => (
          <Parallax
            key={title}
            container={frame}
            y={y}
            rotate={rotate}
            className="absolute w-28 rounded-xl border border-line bg-surface p-3 shadow-sm sm:w-36"
            style={at}
          >
            <p className="text-xs text-fg-muted">{title}</p>
            <p className="mt-0.5 text-lg font-semibold tracking-tight text-fg">{value}</p>
          </Parallax>
        ))}
      </section>
    </div>
  )
}
