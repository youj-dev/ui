import type { MiniatureMeta } from '../engine/types'

/** OLLEN Q–3, robot assistant: what a showroom shows before it mounts. */
export const robotAssistant = {
  id: 'robot-assistant',
  name: 'Robot assistant',
  model: 'OLLEN Q–3',
  maker: 'OLLEN / COMPANION WORKS',
  study: '056',
  spec: 'Q–3 / DESK ASSISTANT · SCREEN FACE · CHEST DISPLAY · ANTENNA LAMP',
  label: 'Robot assistant, OLLEN Q–3',
  description: 'A friendly desk robot: a round-edged head with a dark glass face, glowing screen eyes and a little mouth, an antenna with a lamp on a spring, ears, a chest screen, short arms with mitten hands, and a round base with a light ring. It blinks, glances around and follows your pointer. Type and it listens, its eyes jumping to each key as the letters appear on its chest; press Enter and it thinks, the antenna pulsing and its eyes squinting and rolling, then it replies, typing a short answer on its chest screen with a smile. Click it to wave and say hi, and the number keys set a mood. As a progress indicator it thinks while a page streams an answer, the chest screen and the light ring filling with the progress, and on completion it smiles and says it is done.',
  keys: [
    { keys: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'], caps: ['A–Z'], label: 'talk' },
    { keys: ['Backspace'], caps: ['⌫'], label: 'back' },
    { keys: ['Enter'], caps: ['Enter'], label: 'ask' },
    { keys: ['1', '2', '3', '4'], caps: ['1–4'], label: 'happy · surprised · puzzled · sleepy' },
  ],
  initial: { readout: 'ASK ME ANYTHING', state: 'READY · TYPE TO TALK', pressed: {} },
  viewBox: '-66 -156 132 188',
  progress: true,
} as const satisfies MiniatureMeta
