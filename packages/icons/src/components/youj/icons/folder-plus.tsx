import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/* folder's outline with its tab. The plus turns into a check as file-plus's
 * does: the upright swings into the long arm, the crossbar pivots on its
 * left end into the short arm. */
const PLUS = { long: 'M12 10 L12 16', short: 'M9 13 L15 13' }
const CHECK = { long: 'M15 11 L11 15', short: 'M9 13 L11 15' }

/** New folder → created. The folder takes the new item with a small dip as its plus swings into a check. `active` = added. */
export const FolderPlusIcon = createIcon({
  name: 'folder-plus',
  category: 'files',
  keywords: ['new folder', 'create folder', 'add', 'directory', 'project', 'collection', 'added'],
  states: ['add', 'added'],
  variants: (k) => ({
    folder: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 0.75, 0], transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized']) },
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
    <m.g variants={v.folder} style={origin(12, 19.5)}>
      <path d="M3 17.5 V6.5 A2 2 0 0 1 5 4.5 H8.5 L10.5 6.5 H19 A2 2 0 0 1 21 8.5 V17.5 A2 2 0 0 1 19 19.5 H5 A2 2 0 0 1 3 17.5 Z" />
      <m.path d={PLUS.long} variants={v.long} />
      <m.path d={PLUS.short} variants={v.short} />
    </m.g>
  ),
})
