import { m } from 'motion/react'
import { after, createIcon, seqFor } from './icon-base'

/* Three 6-unit finders with solid eyes, a smaller alignment square in the
 * fourth corner, and a sparse run of modules along the timing row and column. */
const FINDERS = [
  [3.5, 3.5],
  [14.5, 3.5],
  [3.5, 14.5],
] as const
const MODULES = ['M12 3.75 V6', 'M3.75 12 H6', 'M15.25 12 H17.25', 'M12 15.25 V17.25']
const DOTS = [
  [12, 8.75],
  [8.75, 12],
  [12, 12],
  [20.25, 12],
  [12, 20.25],
  [17.75, 17.75],
] as const

/** A code to scan. A scan line sweeps down across it, fading in at the top and out at the bottom. */
export const QrCodeIcon = createIcon({
  name: 'qr-code',
  category: 'commerce',
  keywords: ['qr', 'scan', 'code', 'share link', 'mobile', 'payment', 'ticket', 'barcode', 'qr-code', 'camera'],
  variants: (k) => {
    const length = k.duration('deliberate') * 1.25
    return {
      scan: {
        rest: { opacity: 0, y: -9, transition: { opacity: k.tween('fast'), y: after(k, k.duration('fast'), 'instant') } },
        active: {
          y: [-9, 9],
          opacity: [0, 1, 1, 0],
          transition: {
            y: seqFor(k, length, [0, 1], ['linear']),
            opacity: seqFor(k, length, [0, 0.14, 0.86, 1], ['enter', 'linear', 'exit']),
          },
        },
      },
    }
  },
  render: (v) => (
    <>
      {FINDERS.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width="6" height="6" rx="1.5" />
          <circle cx={x + 3} cy={y + 3} r="1.1" fill="currentColor" stroke="none" />
        </g>
      ))}
      <rect x="15.25" y="15.25" width="5" height="5" rx="1.25" />
      {MODULES.map((d) => (
        <path key={d} d={d} />
      ))}
      {DOTS.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="0.9" fill="currentColor" stroke="none" />
      ))}
      <m.path d="M2.5 12 H21.5" variants={v.scan} />
    </>
  ),
})
