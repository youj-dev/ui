import { m } from 'motion/react'
import { createIcon, FULL_DRAW, origin, seqFor, type IconVariants } from './icon-base'

const COLS = [8.5, 12, 15.5]
const ROWS = [11.75, 14.75, 17.75]
/* What's left of the display while it's blank: a cursor-length dash. */
const CURSOR = 0.08
/* The keys typed on hover, in order: a sum down the diagonal. */
const TYPED = [
  [0, 0],
  [1, 1],
  [2, 2],
] as const

/**
 * Crunching numbers. Three keys press in turn down the diagonal, then the
 * display clears and the result runs in from the right.
 */
export const CalculatorIcon = createIcon({
  name: 'calculator',
  category: 'commerce',
  keywords: ['math', 'sum', 'compute', 'finance', 'accounting', 'total', 'numbers', 'budget', 'calc'],
  variants: (k): IconVariants => {
    const length = k.duration('deliberate') * 1.3
    const press = k.duration('base') / length
    const keys = Object.fromEntries(
      TYPED.map(([c, r], i) => {
        const start = 0.02 + i * 0.14
        return [
          `k${c}${r}`,
          {
            rest: { scale: 1, transition: k.tween('fast') },
            active: {
              scale: [null, 1, 0.2, 1, 1],
              transition: seqFor(k, length, [0, start, start + press * 0.45, start + press, 1], ['linear', 'exit', 'enter', 'linear']),
            },
          },
        ]
      }),
    )
    return {
      ...keys,
      display: {
        rest: { pathLength: FULL_DRAW, opacity: 1, transition: k.tween('fast') },
        active: {
          // Clears (fading as it retracts), blinks back as a cursor at the right, and the result runs in.
          // It never reaches zero length: a zero-length dash can leave a stray cap at the far end.
          pathLength: [null, FULL_DRAW, CURSOR, CURSOR, FULL_DRAW],
          opacity: [null, 1, 0, 1, 1],
          transition: {
            pathLength: seqFor(k, length, [0, 0.5, 0.6, 0.66, 1], ['linear', 'exit', 'linear', 'emphasized']),
            opacity: seqFor(k, length, [0, 0.5, 0.6, 0.62, 1], ['linear', 'exit', 'linear', 'linear']),
          },
        },
      },
    }
  },
  render: (v) => (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2.5" />
      {/* Drawn from the right, like digits entering a display. */}
      <m.path d="M15.5 7.25 H8.5" variants={v.display} />
      {ROWS.map((y, r) =>
        COLS.map((x, c) =>
          v[`k${c}${r}`] ? (
            <m.circle key={`${c}${r}`} cx={x} cy={y} r="0.9" fill="currentColor" stroke="none" variants={v[`k${c}${r}`]} style={origin(x, y)} />
          ) : (
            <circle key={`${c}${r}`} cx={x} cy={y} r="0.9" fill="currentColor" stroke="none" />
          ),
        ),
      )}
    </>
  ),
})
