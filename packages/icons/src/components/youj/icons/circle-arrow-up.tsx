import { m } from 'motion/react'
import { createIcon } from './icon-base'

/* One closed six-point path in both states. The arrow walks left tip, apex,
 * right tip, back to the apex, down the shaft and up again; the square walks
 * its corners with a midpoint top and bottom. The tips become the top
 * corners and the doubled-back apexes swing out into the bottom corners, so
 * the arrow inflates into the square. */
const ARROW = 'M8 11.5 L12 7.5 L16 11.5 L12 7.5 L12 16.5 L12 7.5 Z'
const SQUARE = 'M8.5 8.5 L12 8.5 L15.5 8.5 L15.5 15.5 L12 15.5 L8.5 15.5 Z'

/**
 * Send ↔ stop, for a prompt box while a reply streams in. The arrow opens
 * its head and swings its shaft out into a square that fills solid; when
 * generation ends the square folds back into the arrow. `active` = stop.
 */
export const CircleArrowUpIcon = createIcon({
  name: 'circle-arrow-up',
  category: 'actions',
  keywords: ['send', 'submit', 'prompt', 'ai', 'stop generating', 'stop', 'chat', 'upload'],
  states: ['send', 'stop'],
  variants: (k) => {
    const shape = (d: string) => ({ d, transition: k.tween('base', 'emphasized') })
    return {
      mark: { rest: shape(ARROW), active: shape(SQUARE) },
      fill: {
        rest: { ...shape(ARROW), opacity: 0, transition: { ...k.tween('base', 'emphasized'), opacity: k.tween('fast', 'exit') } },
        active: { ...shape(SQUARE), opacity: 1, transition: { ...k.tween('base', 'emphasized'), opacity: { ...k.tween('fast'), delay: k.duration('base') * 0.7 } } },
      },
    }
  },
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.path d={ARROW} fill="currentColor" stroke="none" variants={v.fill} />
      <m.path d={ARROW} variants={v.mark} />
    </>
  ),
})
