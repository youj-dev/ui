import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const RIBBON = 'M18 21 L12 17 L6 21 V5 A2 2 0 0 1 8 3 H16 A2 2 0 0 1 18 5 Z'
const PLUS = { long: 'M12 7 L12 13', short: 'M9 10 L15 10' }
const CHECK = { long: 'M15 8 L11 12', short: 'M9 10 L11 12' }

/** Add to a collection → added. The ribbon tugs and the plus swings into a check with a small settle. `active` = added. */
export const BookmarkPlusIcon = createIcon({
  name: 'bookmark-plus',
  category: 'navigation',
  keywords: ['save', 'add bookmark', 'collection', 'read later', 'favorite', 'saved'],
  states: ['add', 'added'],
  variants: (k) => ({
    ribbon: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 1.25, 0], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
    },
    long: {
      rest: { d: PLUS.long, transition: k.spring('snappy') },
      active: { d: CHECK.long, transition: k.spring('settle') },
    },
    short: {
      rest: { d: PLUS.short, transition: k.spring('snappy') },
      active: { d: CHECK.short, transition: k.spring('settle') },
    },
  }),
  render: (v) => (
    <m.g variants={v.ribbon}>
      <path d={RIBBON} />
      <m.path d={PLUS.long} variants={v.long} />
      <m.path d={PLUS.short} variants={v.short} />
    </m.g>
  ),
})
