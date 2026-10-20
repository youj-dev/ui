import type { MiniatureMeta } from '../engine/types'

/** ORVANE R–80, refractor telescope: what a showroom shows before it mounts. */
export const telescope = {
  id: 'telescope',
  name: 'Refractor telescope',
  model: 'ORVANE R–80',
  maker: 'ORVANE / SKY INSTRUMENTS',
  study: '028',
  spec: 'R–80 / Ø80 MM · 500 MM · EQUATORIAL',
  label: 'Refractor telescope, ORVANE R–80',
  description: 'Arrow keys slew the right ascension and declination axes. Pick the Moon, Saturn or Jupiter with 1, 2 or 3 and the mount slews to it. T engages sidereal tracking, F racks the focuser and L switches the controller and reticle to red night light.',
  keys: [
    {
      keys: ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'],
      caps: ['← ↑ ↓ →'],
      label: 'slew',
    },
    { keys: ['1', '2', '3'], caps: ['1–3'], label: 'target' },
    { keys: ['t'], caps: ['T'], label: 'tracking', toggle: true },
    { keys: ['f'], caps: ['F'], label: 'focus' },
    { keys: ['l'], caps: ['L'], label: 'red light', toggle: true },
  ],
  initial: {
    readout: 'RA −78.0° · DEC +26.0°',
    state: 'MOON · MANUAL / OFFSET',
    pressed: { t: false, l: false },
  },
  viewBox: '-186.55652367012382 -261.1376173525877 463.35067338034514 470.1376173525877',
  progress: false,
} as const satisfies MiniatureMeta
