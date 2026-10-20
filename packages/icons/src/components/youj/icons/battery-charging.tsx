import { m } from 'motion/react'
import { after, createIcon, type IconVariants } from './icon-base'

/* battery's body and cells. Charging, each cell swings into one stroke of a
 * bolt (top diagonal, crossbar, bottom diagonal) whose tips land on the
 * casing; a mask built from the same strokes opens the casing around them. */
const CELLS = [
  ['M6.5 10 L6.5 14', 'M11.75 7 L8.5 12'],
  ['M10 10 L10 14', 'M8.5 12 L12.5 12'],
  ['M13.5 10 L13.5 14', 'M12.5 12 L9.25 17'],
] as const

/**
 * Battery ↔ charging. The three cells tilt and slide into one another until
 * they fuse into a bolt that breaks through the casing top and bottom;
 * unplugging splits the bolt back into cells. `active` = charging.
 */
export const BatteryChargingIcon = createIcon({
  name: 'battery-charging',
  category: 'system',
  keywords: ['battery', 'charging', 'power', 'energy', 'plugged in', 'charge', 'level'],
  states: ['battery', 'charging'],
  variants: (k): IconVariants => {
    const s = k.stagger('tight')
    const last = CELLS.length - 1
    return Object.fromEntries(
      CELLS.map(([cell, bolt], i) => [
        `c${i}`,
        {
          rest: { d: cell, transition: after(k, (last - i) * s, 'base') },
          active: { d: bolt, transition: after(k, i * s, 'slow', 'emphasized') },
        },
      ]),
    )
  },
  render: (v, { id }) => (
    <>
      <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
        <rect width="24" height="24" fill="white" stroke="none" />
        {CELLS.map(([cell], i) => (
          <m.path key={cell} d={cell} stroke="black" strokeWidth={4} variants={v[`c${i}`]} />
        ))}
      </mask>
      <g mask={`url(#${id}-m)`}>
        <rect x="2.5" y="7" width="16" height="10" rx="2" />
      </g>
      <path d="M21.5 10.5 V13.5" />
      {CELLS.map(([cell], i) => (
        <m.path key={cell} d={cell} variants={v[`c${i}`]} />
      ))}
    </>
  ),
})
