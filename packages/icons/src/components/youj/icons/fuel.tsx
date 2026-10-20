import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Filling up: the nozzle lifts off its hook and the display flickers as the litres count. */
export const FuelIcon = createIcon({
  name: 'fuel',
  category: 'location',
  keywords: ['gas station', 'petrol', 'fuel', 'refuel', 'energy', 'charging point'],
  variants: (k) => ({
    hose: {
      rest: { rotate: 0, transition: k.tween('base') },
      active: { rotate: [0, -10, -10, 0], transition: seq(k, 'deliberate', [0, 0.3, 0.6, 1], ['standard', 'linear', 'emphasized']) },
    },
    screen: {
      rest: { opacity: 1, transition: k.tween('fast') },
      active: { opacity: [1, 0.3, 1, 0.3, 1], transition: seq(k, 'deliberate', [0, 0.2, 0.45, 0.7, 1]) },
    },
  }),
  render: (v) => (
    <>
      <path d="M4 21 V5.5 A2 2 0 0 1 6 3.5 H11.5 A2 2 0 0 1 13.5 5.5 V21" />
      <path d="M2.5 21 H15" />
      <m.rect x="6.25" y="6.5" width="5" height="4" rx="0.75" variants={v.screen} />
      <m.path d="M13.5 10 H15.5 A1.5 1.5 0 0 1 17 11.5 V16.5 A1.5 1.5 0 0 0 20 16.5 V8 L17.5 5.5" variants={v.hose} style={origin(13.5, 10)} />
    </>
  ),
})
