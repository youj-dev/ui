import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* braces' curly brackets at file size: each is a nib, two straight runs and
 * two turned ends, drawn on 1-unit radii so they stay crisp at 16px. */
const LEFT = 'M9.75 11 H9.5 A1 1 0 0 0 8.5 12 V13.5 A1 1 0 0 1 7.5 14.5 A1 1 0 0 1 8.5 15.5 V17 A1 1 0 0 0 9.5 18 H9.75'
const RIGHT = 'M14.25 11 H14.5 A1 1 0 0 1 15.5 12 V13.5 A1 1 0 0 0 16.5 14.5 A1 1 0 0 0 15.5 15.5 V17 A1 1 0 0 1 14.5 18 H14.25'

/** A JSON file. The braces part, a value blinks in between them, and they close over it. */
export const FileJsonIcon = createIcon({
  name: 'file-json',
  category: 'files',
  keywords: ['json', 'data file', 'object', 'config', 'schema', 'braces', 'file-json', 'file-json-2'],
  variants: (k) => {
    const part = (x: number) => ({
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, x, x, 0], transition: seq(k, 'deliberate', [0, 0.25, 0.7, 1], ['standard', 'linear', 'emphasized']) },
    })
    return {
      left: part(-1),
      right: part(1),
      value: {
        rest: { scale: 0, opacity: 0, transition: k.tween('fast', 'exit') },
        active: {
          scale: [null, 0, 1, 1, 0, 0],
          opacity: [null, 0, 1, 1, 0, 0],
          transition: seq(k, 'deliberate', [0, 0.22, 0.36, 0.6, 0.74, 1], ['linear', 'enter', 'linear', 'exit', 'linear']),
        },
      },
    }
  },
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.path d={LEFT} variants={v.left} />
      <m.path d={RIGHT} variants={v.right} />
      <m.circle cx="12" cy="14.5" r="0.9" fill="currentColor" stroke="none" variants={v.value} style={origin(12, 14.5)} />
    </>
  ),
})
