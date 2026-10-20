import type { MiniatureMeta } from '../engine/types'

/** AEREN F–04, weather station: what a showroom shows before it mounts. */
export const weatherStation = {
  id: 'weather-station',
  name: 'Weather station',
  model: 'AEREN F–04',
  maker: 'AEREN / FIELD INSTRUMENTS',
  study: '024',
  spec: 'F–04 / SOLAR · 20 MM COLLECTOR',
  label: 'Weather station, AEREN F–04',
  description: 'A solar panel, three rotating wind cups, directional vane, graduated rain collector and seven-segment display on a bolted mast. Adjust wind, make rain, drain the collector or switch day and night.',
  keys: [
    { keys: ['w'], caps: ['W'], label: 'wind +' },
    { keys: ['shift+w'], caps: ['⇧ W'], label: 'wind −' },
    { keys: ['r'], caps: ['R'], label: 'rain' },
    { keys: ['shift+r'], caps: ['⇧ R'], label: 'drain' },
    { keys: ['d'], caps: ['D'], label: 'day / night' },
  ],
  initial: { readout: '8.0 km/h · 0.0 mm', state: 'DAY · SOLAR 14 W · NE 045°', pressed: {  } },
  viewBox: '-126.52112466548594 -325 330.98453567157134 501.5',
  progress: false,
} as const satisfies MiniatureMeta
