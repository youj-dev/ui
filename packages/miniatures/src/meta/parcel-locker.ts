import type { MiniatureMeta } from '../engine/types'

/** SELVO P–06, parcel locker: what a showroom shows before it mounts. */
export const parcelLocker = {
  id: 'parcel-locker',
  name: 'Parcel locker',
  model: 'SELVO P–06',
  maker: 'SELVO / NEIGHBOURHOOD POST',
  study: '022',
  spec: 'P–06 / SIX BAYS · RETRACTABLE SHELVES',
  label: 'Parcel locker, SELVO P–06',
  description: 'Type the demo code 2468, then press Enter to open locker 04. Enter again collects the parcel and closes the door. Escape clears the code or returns the parcel and closes the door. Click the barcode scanner for another valid code. Touchscreen buttons and door handles also work with Enter or Space when focused.',
  keys: [
    { keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], caps: ['0–9'], label: 'code' },
    { keys: ['Enter'], caps: ['Enter'], label: 'open / collect' },
    { keys: ['Escape'], caps: ['Esc'], label: 'clear / close · click scanner for a code' },
  ],
  initial: { readout: 'CODE · – – – –', state: 'READY / DEMO 2468 → 04', pressed: {  } },
  viewBox: '-83.8801085141084 -274 350.49157722673334 483',
  progress: false,
} as const satisfies MiniatureMeta
