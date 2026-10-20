import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const CELLS = [6.5, 10, 13.5]

/** Charging: the cells drain, then fill one by one. */
export const BatteryIcon = createIcon({
  name: 'battery',
  category: 'system',
  keywords: ['power', 'charge', 'energy', 'level', 'charging'],
  variants: (k) => {
    const cell = (i: number) => ({
      rest: { opacity: 1, transition: k.tween('fast') },
      active: {
        opacity: [1, 0.15, 0.15, 1],
        transition: seq(k, 'deliberate', [0, 0.12, 0.3 + i * 0.22, 0.42 + i * 0.22], ['exit', 'linear', 'enter']),
      },
    })
    return { c0: cell(0), c1: cell(1), c2: cell(2) }
  },
  render: (v) => (
    <>
      <rect x="2.5" y="7" width="16" height="10" rx="2" />
      <path d="M21.5 10.5 V13.5" />
      {CELLS.map((x, i) => (
        <m.path key={x} d={`M${x} 10 V14`} variants={v[`c${i}` as 'c0']} />
      ))}
    </>
  ),
})
