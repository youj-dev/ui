import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, origin, seq } from './icon-base'

/* The browser measures the four loops a little short when it dashes the
 * stroke, which would leave a notch where the path closes on itself. Drawing
 * to a hair over full length keeps the join sealed. */
const FULL = 1.03

/* The ⌘ as keycaps print it: big loops (r 3.25) round a tight center square
 * (4.5 across), one continuous stroke that runs each side and loops at every
 * corner. */
const GLYPH = 'M14.25 6.5 V17.5 A3.25 3.25 0 1 0 17.5 14.25 H6.5 A3.25 3.25 0 1 0 9.75 17.5 V6.5 A3.25 3.25 0 1 0 6.5 9.75 H17.5 A3.25 3.25 0 1 0 14.25 6.5'

/** A keypress: the key dips under the finger and the ⌘ is retraced in one continuous stroke through all four loops. */
export const CommandIcon = createIcon({
  name: 'command',
  category: 'development',
  keywords: ['cmd', 'keyboard', 'shortcut', 'hotkey', 'mac', 'command palette', 'keybinding'],
  variants: (k) => ({
    key: {
      rest: { scale: 1, transition: k.tween('fast') },
      active: { scale: [1, 0.86, 1], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
    },
    glyph: {
      from: hidden,
      rest: { ...drawn(k), pathLength: FULL },
      active: { ...drawIn(k, 'deliberate', 0, 'emphasized'), pathLength: [0, FULL] },
    },
  }),
  render: (v) => (
    <m.g variants={v.key} style={origin(12, 12)}>
      <m.path d={GLYPH} variants={v.glyph} />
    </m.g>
  ),
})
