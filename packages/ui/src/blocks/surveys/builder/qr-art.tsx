'use client'

import { useMemo } from 'react'
import { m } from 'motion/react'
import { MotionFeatures, useYouj } from '@youj/core'

/* Art in the shape of a QR code for the share card: three finder squares
 * and a field of modules drawn from the link, so every survey's card is its
 * own. It's a picture (hidden from assistive technology) and it doesn't scan;
 * pass `qrCode` to the builder to draw a real one with your QR library. It
 * opens from its middle the first time it's drawn. Reduced motion: drawn at once. */

const SIZE = 25

function hash(text: string) {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

/** A finder's ring and core, at its corner. */
const finder = (x: number, y: number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`

function modules(value: string) {
  let state = hash(value) || 1
  const random = () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
  const reserved = (x: number, y: number) => (x < 8 && y < 8) || (x > SIZE - 9 && y < 8) || (x < 8 && y > SIZE - 9)
  let d = finder(0, 0) + finder(SIZE - 7, 0) + finder(0, SIZE - 7)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      if (reserved(x, y)) continue
      // The timing lines along row and column 6 alternate, as a real code's do.
      const on = y === 6 || x === 6 ? (x + y) % 2 === 0 : random() < 0.48
      if (on) d += `M${x} ${y}h1v1h-1z`
    }
  }
  return d
}

export function QrArt({ value, className }: { value: string; className?: string }) {
  const k = useYouj()
  const d = useMemo(() => modules(value), [value])
  return (
    <MotionFeatures>
      <m.svg
        viewBox={`-2 -2 ${SIZE + 4} ${SIZE + 4}`}
        shapeRendering="crispEdges"
        aria-hidden
        className={className}
        initial={k.reduced ? false : { clipPath: 'circle(0% at 50% 50%)' }}
        animate={{ clipPath: 'circle(75% at 50% 50%)' }}
        transition={k.tween('deliberate', 'emphasized')}
      >
        <path d={d} fill="currentColor" fillRule="evenodd" />
      </m.svg>
    </MotionFeatures>
  )
}
