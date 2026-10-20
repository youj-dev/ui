import { m } from 'motion/react'
import { createIcon, drawn, FULL_DRAW, origin, seq, type IconVariants } from './icon-base'

/* The mouth of the cone, centered where its rim crosses the 45° axis. Each
 * piece of confetti is thrown from there to its resting place. */
const MOUTH = { x: 10.5, y: 13.5 }
const PIECES = [
  { d: 'M8.5 5.5 h.01', x: 8.5, y: 5.5, dot: true },
  { d: 'M13.25 5 L14.25 3.5', x: 13.75, y: 4.25 },
  { d: 'M17.5 11 L19.25 10.5', x: 18.4, y: 10.75 },
  { d: 'M19.5 15.5 h.01', x: 19.5, y: 15.5, dot: true },
]
const STREAMER = 'M13.5 10.5 C15 9 15.5 10.25 16.75 9 C18 7.75 17 6.75 18.5 5.25'

/**
 * Celebrate. The popper kicks back in the hand and throws its confetti out
 * of the mouth, each piece flying to where it rests while the streamer
 * unfurls after them.
 */
export const PartyPopperIcon = createIcon({
  name: 'party-popper',
  category: 'status',
  keywords: ['celebrate', 'confetti', 'party', 'success', 'launch', 'congrats', 'milestone'],
  variants: (k): IconVariants => {
    const s = k.stagger('base')
    const burst = [0, 0.2, 1]
    const eases = ['exit', 'enter'] as ['exit', 'enter']
    return {
      cone: {
        rest: { x: 0, y: 0, transition: k.tween('fast') },
        active: { x: [null, -0.75, 0], y: [null, 0.75, 0], transition: seq(k, 'slow', [0, 0.25, 1], ['exit', 'emphasized']) },
      },
      ...Object.fromEntries(
        PIECES.map(({ x, y }, i) => [
          `p${i}`,
          {
            rest: { x: 0, y: 0, opacity: 1, scale: 1, transition: k.tween('fast') },
            active: {
              x: [null, (MOUTH.x - x) * 0.8, 0],
              y: [null, (MOUTH.y - y) * 0.8, 0],
              opacity: [null, 0, 1],
              scale: [null, 0.4, 1],
              transition: seq(k, 'slow', burst, eases, k.duration('instant') + i * s),
            },
          },
        ]),
      ),
      streamer: {
        rest: drawn(k),
        active: {
          pathLength: [null, 0, FULL_DRAW],
          opacity: [null, 0, 1],
          transition: seq(k, 'deliberate', [0, 0.15, 1], ['exit', 'emphasized'], k.duration('instant')),
        },
      },
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.cone}>
        <path d="M7.25 10.25 L3 21 L13.75 16.75" />
        <ellipse cx={MOUTH.x} cy={MOUTH.y} rx="4.6" ry="1.6" transform={`rotate(45 ${MOUTH.x} ${MOUTH.y})`} />
      </m.g>
      <m.path d={STREAMER} variants={v.streamer} />
      {PIECES.map(({ d, x, y, dot }, i) => (
        <m.path key={d} d={d} strokeWidth={dot ? 2 : undefined} variants={v[`p${i}`]} style={origin(x, y)} />
      ))}
    </>
  ),
})
