import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The upload chevron and the check share one three-point structure, so the
 * chevron's apex can drop into the check's vertex. */
const UP = 'M9.5 14 L12.25 11.25 L15 14'
const CHECK = 'M9.5 14 L11.5 16 L15 12.5'

/**
 * Cloud ↔ synced. An upload chevron rises into the cloud and folds over into
 * a check; unsyncing unfolds it and lets it sink away. `active` = synced.
 */
export const CloudIcon = createIcon({
  name: 'cloud',
  category: 'development',
  keywords: ['sync', 'synced', 'saved', 'hosting', 'storage', 'backup', 'online'],
  states: ['cloud', 'synced'],
  variants: (k) => ({
    mark: {
      rest: { d: UP, y: 3, opacity: 0, transition: { d: k.tween('fast'), y: k.tween('base', 'exit'), opacity: k.tween('base', 'exit') } },
      active: {
        d: [null, UP, CHECK],
        y: [null, 0, 0],
        opacity: [null, 1, 1],
        transition: seq(k, 'deliberate', [0, 0.45, 1], ['enter', 'emphasized']),
      },
    },
  }),
  render: (v) => (
    <>
      <path d="M17 18.5 H7 A3 3 0 0 1 6.73 12.51 A5 5 0 1 1 16.48 10.53 A4 4 0 1 1 17 18.5" />
      <m.path d={UP} variants={v.mark} />
    </>
  ),
})
