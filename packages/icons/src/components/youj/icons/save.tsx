import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* Label, flat line and check share one four-point structure (the check repeats
 * its vertex). Going through the flat line keeps every point moving one way:
 * the U's legs fold in and its top drops, then the line's ends lift. Wildcard
 * first keyframes start each morph from wherever the stroke currently is. */
const LABEL = 'M7.5 20.5 L7.5 14.5 L16.5 14.5 L16.5 20.5'
const FLAT = 'M7.5 16.5 L10 16.5 L12 16.5 L16.5 16.5'
const CHECK = 'M8.5 14 L11 16.5 L11 16.5 L15.5 12'

/** Save → saved. The disk takes the write, its label folds flat and the line's ends lift into a check. `active` = saved. */
export const SaveIcon = createIcon({
  name: 'save',
  category: 'files',
  keywords: ['floppy', 'disk', 'store', 'saved', 'write', 'keep'],
  states: ['save', 'saved'],
  variants: (k) => ({
    disk: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [0, 0.75, 0], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
    },
    label: {
      rest: { d: [null, FLAT, LABEL], transition: seq(k, 'slow', [0, 0.4, 1], ['exit', 'enter']) },
      active: { d: [null, FLAT, CHECK], transition: seq(k, 'deliberate', [0, 0.35, 1], ['exit', 'enter']) },
    },
  }),
  render: (v) => (
    <m.g variants={v.disk} style={origin(12, 20.5)}>
      <path d="M3.5 5.5 A2 2 0 0 1 5.5 3.5 H16 L20.5 8 V18.5 A2 2 0 0 1 18.5 20.5 H5.5 A2 2 0 0 1 3.5 18.5 Z" />
      <path d="M7.5 3.5 V6.5 A1 1 0 0 0 8.5 7.5 H14.5" />
      <m.path d={LABEL} variants={v.label} />
    </m.g>
  ),
})
