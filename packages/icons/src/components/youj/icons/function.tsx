import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** The ƒ is written out again, the stem first and then the crossbar. */
export const FunctionIcon = createIcon({
  name: 'function',
  category: 'data',
  keywords: ['function', 'formula', 'math', 'calculate', 'fx', 'expression'],
  variants: (k) => ({
    stem: { rest: drawn(k), active: drawIn(k, 'slow', 0, 'standard') },
    bar: { rest: drawn(k), active: drawIn(k, 'fast', k.duration('slow'), 'standard') },
  }),
  render: (v) => (
    <>
      <m.path d="M16.5 4.5 C14.5 3.75 12.75 4.75 12.4 7 L10.6 17 C10.25 19.25 8.5 20.25 6.5 19.5" variants={v.stem} />
      <m.path d="M8.5 10 H15" variants={v.bar} />
    </>
  ),
})
