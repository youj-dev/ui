import type { MiniatureMeta } from '../engine/types'

/** NALDEN R–10, rotary phone: what a showroom shows before it mounts. */
export const rotaryPhone = {
  id: 'rotary-phone',
  name: 'Rotary phone',
  model: 'NALDEN R–10',
  maker: 'NALDEN / TELEPHONIC WORKS',
  study: '028',
  spec: 'R–10 / PULSE DIAL · 10 PPS · 3 LINES',
  label: 'Rotary phone, NALDEN R–10',
  description: 'An ivory key telephone with a sloped front: a ten-hole finger wheel over a number plate that lights when the handset is lifted, a cradle with hook plungers, lit line and hold keys, a dialled-number card, twin gongs behind a side window and a coiled handset cord. Lift the handset, dial, take an incoming call or put it on hold.',
  keys: [
    { keys: ['h'], caps: ['H'], label: 'handset' },
    { keys: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'], caps: ['0–9'], label: 'dial' },
    { keys: ['r'], caps: ['R'], label: 'ring / quiet' },
    { keys: ['k'], caps: ['K'], label: 'hold' },
  ],
  initial: { readout: '— — — · ON HOOK', state: 'READY FOR A CALL', pressed: {  } },
  viewBox: '-186.9371315644566 -154.5 410.2473300878596 382.5',
  progress: false,
} as const satisfies MiniatureMeta
