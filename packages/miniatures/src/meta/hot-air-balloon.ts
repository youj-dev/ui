import type { MiniatureMeta } from '../engine/types'

/** CIRREL Q–31, hot air balloon: what a showroom shows before it mounts. */
export const hotAirBalloon = {
  id: 'hot-air-balloon',
  name: 'Hot air balloon',
  model: 'CIRREL Q–31',
  maker: 'CIRREL / AEROSTAT WORKS',
  study: '050',
  spec: 'Q–31 / STRIPED ENVELOPE · PROPANE BURNER · 60 M TETHER',
  label: 'Hot air balloon, CIRREL Q–31',
  description:
    'A hot air balloon tethered over a small turf landing patch: striped gores under a parachute valve, a scoop skirt, load cables down to the burners on flexi poles, and a wicker basket with sandbags, with a windsock on the patch and clouds drifting past. Hold Space or press and hold the balloon to fire the burner: the flame roars, the envelope glows from inside and the balloon rises toward the top of its tether. Let go and it cools and slowly sinks, the basket swaying, until it lands. The arrow keys turn the wind and the balloon drifts with it, and the vent spills hot air to bring it down. Left alone, the pilot holds a hover. As a progress indicator the altitude follows the progress, and on completion it climbs to the top of the tether.',
  keys: [
    { keys: [' '], caps: ['Space'], label: 'hold to fire the burner' },
    { keys: ['ArrowLeft', 'ArrowRight'], caps: ['←', '→'], label: 'wind' },
    { keys: ['ArrowDown'], caps: ['↓'], label: 'vent' },
    { keys: ['p'], caps: ['P'], label: 'progress +25%' },
    { keys: ['Enter'], caps: ['Enter'], label: 'done' },
  ],
  initial: { readout: 'ALT 30 M · ENV 95°C · WIND CALM', state: 'HOVERING · HOLD SPACE TO FIRE', pressed: {} },
  viewBox: '-72 -202 144 234',
  progress: true,
} as const satisfies MiniatureMeta
