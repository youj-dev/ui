import { m } from 'motion/react'
import { createIcon, seqFor, type IconVariants } from './icon-base'

/* The beam sweeps x 4.5 → 19.5 at a constant rate, so "when does it reach x"
 * is simply (x - 4.5) / 15. The portrait brightens once the beam has cleared
 * it and each detail line is written exactly as the beam crosses it. */
const at = (x: number) => (x - 4.5) / 15
const DETAILS = [
  { d: 'M14 10 H18', from: 14, to: 18 },
  { d: 'M14 13.5 H16.5', from: 14, to: 16.5 },
]

/** The card is read: its details dim, a scan line sweeps across, and each detail is restored as the line passes over it. */
export const IdCardIcon = createIcon({
  name: 'id-card',
  category: 'people',
  keywords: ['identity', 'badge', 'license', 'verify', 'passport', 'kyc', 'profile'],
  variants: (k): IconVariants => {
    const length = k.duration('deliberate') * 1.4
    const details: IconVariants = Object.fromEntries(
      DETAILS.map(({ from, to }, i) => [
        `l${i}`,
        {
          rest: { pathLength: 1, opacity: 1, transition: k.tween('fast') },
          active: {
            pathLength: [1, 0, 0, 1, 1],
            opacity: [1, 0, 0, 1, 1],
            transition: {
              pathLength: seqFor(k, length, [0, 0.06, at(from), at(to), 1], ['linear', 'linear', 'linear', 'linear']),
              opacity: seqFor(k, length, [0, 0.05, at(from), at(from) + 0.01, 1], ['linear', 'linear', 'linear', 'linear']),
            },
          },
        },
      ]),
    )
    return {
      ...details,
      beam: {
        rest: { x: 0, opacity: 0, transition: k.tween('fast') },
        active: {
          x: [0, 15],
          opacity: [0, 1, 1, 0],
          transition: { x: seqFor(k, length, [0, 1], ['linear']), opacity: seqFor(k, length, [0, 0.06, 0.9, 1], ['linear', 'linear', 'linear']) },
        },
      },
      portrait: {
        rest: { opacity: 1, transition: k.tween('fast') },
        active: { opacity: [1, 0.25, 0.25, 1, 1], transition: seqFor(k, length, [0, 0.06, at(11.5), at(11.5) + 0.12, 1], ['linear', 'linear', 'enter', 'linear']) },
      },
    }
  },
  render: (v) => (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <m.g variants={v.portrait}>
        <circle cx="8.5" cy="10" r="2" />
        <path d="M5.5 15.5 A3 3 0 0 1 11.5 15.5" />
      </m.g>
      {DETAILS.map(({ d }, i) => (
        <m.path key={d} d={d} variants={v[`l${i}`]} />
      ))}
      <m.path d="M4.5 8 V16" variants={v.beam} />
    </>
  ),
})
