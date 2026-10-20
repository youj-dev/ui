'use client'

import { Tilt } from '@youj/motion'

export default function TiltDemo() {
  return (
    // Rounded corners go on Tilt itself, so the glare clips to them.
    <Tilt glare scale={1.02} className="w-full max-w-sm rounded-2xl">
      <div className="relative flex aspect-[1.75] flex-col justify-between overflow-hidden rounded-[inherit] border border-line bg-surface p-5 shadow-lg">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(110%_90%_at_100%_0%,color-mix(in_oklch,var(--color-accent)_30%,transparent),transparent_62%)]"
        />
        <svg aria-hidden viewBox="0 0 200 200" className="absolute -right-20 -bottom-28 size-72 text-fg opacity-[0.07]">
          {Array.from({ length: 9 }, (_, i) => (
            <circle key={i} cx="100" cy="100" r={12 + i * 11} fill="none" stroke="currentColor" />
          ))}
        </svg>
        <div className="relative flex items-start justify-between">
          <p className="text-sm font-semibold tracking-tight text-fg">youj ship</p>
          <p className="font-mono text-xs text-fg-muted">Oct 14 · Online</p>
        </div>
        <div className="relative">
          <p className="text-xl font-semibold tracking-tight text-fg">Priya Raman</p>
          <p className="text-sm text-fg-muted">Staff engineer, Northwind</p>
        </div>
        <div className="relative flex items-end justify-between border-t border-dashed border-line-strong pt-3 font-mono text-xs">
          <span className="text-fg-muted">Ticket</span>
          <span className="tracking-[0.2em] text-fg">#0142</span>
        </div>
      </div>
    </Tilt>
  )
}
