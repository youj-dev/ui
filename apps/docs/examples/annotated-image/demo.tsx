'use client'

import type { CSSProperties } from 'react'
import { AnnotatedImage, type ImageAnnotation } from '@youj/react'

/* Its rubber, frame and cab stay darker than the box in both themes (`--yj-dark` picks each mix), so it never inverts into a pale cab on pale tires. */
const PALETTE = {
  '--truck-cab': 'color-mix(in oklab, var(--color-fg) calc(78% - 52% * var(--yj-dark)), var(--color-surface))',
  '--truck-rubber': 'color-mix(in oklab, var(--color-fg) calc(100% - 100% * var(--yj-dark)), var(--color-canvas))',
  '--truck-frame': 'color-mix(in oklab, var(--color-fg) calc(70% - 70% * var(--yj-dark)), var(--color-canvas))',
  '--truck-rim': 'color-mix(in oklab, var(--color-fg) calc(26% + 22% * var(--yj-dark)), var(--color-surface))',
} as CSSProperties

/** A flat side view of a refrigerated truck, drawn in the theme's tones: stands in for your photo. */
function Truck() {
  return (
    <svg viewBox="0 0 640 300" role="img" aria-label="Refrigerated truck, side view" style={PALETTE} className="block h-auto w-full bg-[color-mix(in_oklab,var(--color-fg)_4%,var(--color-surface))]">
      <ellipse cx="330" cy="262" rx="290" ry="9" className="fill-well" />
      <rect x="56" y="66" width="384" height="152" rx="10" className="fill-[color-mix(in_oklab,var(--color-fg)_3%,var(--color-surface))] stroke-line-strong" strokeWidth="1.5" />
      {Array.from({ length: 9 }, (_, i) => (
        <line key={i} x1={94 + i * 38} x2={94 + i * 38} y1="74" y2="210" className="stroke-line" strokeWidth="1.5" />
      ))}
      <rect x="442" y="82" width="26" height="72" rx="4" className="fill-(--truck-cab)" />
      <path d="M472 108 L538 108 Q560 108 568 126 L590 168 Q596 178 596 190 L596 222 L472 222 Z" className="fill-(--truck-cab)" />
      <path d="M540 120 L554 120 Q562 120 566 130 L578 160 L540 160 Z" className="fill-[color-mix(in_oklab,var(--color-accent)_30%,var(--color-surface))]" />
      <rect x="482" y="194" width="50" height="18" rx="9" className="fill-(--truck-rim)" />
      <rect x="56" y="218" width="540" height="10" rx="3" className="fill-(--truck-frame)" />
      {[118, 170, 392, 540].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="236" r="24" className="fill-(--truck-rubber) stroke-line-strong" strokeWidth="1" />
          <circle cx={cx} cy="236" r="9" className="fill-(--truck-rim)" />
        </g>
      ))}
    </svg>
  )
}

const NOTES: ImageAnnotation[] = [
  { id: 'reefer', x: 62, y: 28, title: 'Reefer unit', detail: '34.1°F · set 34°F' },
  { id: 'load', x: 34, y: 46, title: 'Load', detail: '14 of 26 pallets · 8,420 lb' },
  { id: 'cab', x: 89, y: 44, title: 'Driver', detail: 'On duty 6 h 12 min' },
  { id: 'fuel', x: 71, y: 72, title: 'Fuel', detail: '64% · 412 mi range' },
  { id: 'axles', x: 22, y: 79, title: 'Trailer axles', detail: 'Tire pressure normal' },
]

export default function AnnotatedImageDemo() {
  return (
    <div className="w-full max-w-4xl">
      <AnnotatedImage annotations={NOTES} media={<Truck />} caption="Unit TR-5531 · last reading 2 min ago" />
    </div>
  )
}
