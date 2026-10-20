import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Add. The plus turns a quarter inside the ring, tucking in as it goes, and lands on its own silhouette; the ring holds still. */
export const CirclePlusIcon = createIcon({
  name: 'circle-plus',
  category: 'actions',
  keywords: ['plus-circle', 'add', 'create', 'new', 'insert', 'include', 'more'],
  variants: (k) => ({
    cross: {
      rest: { rotate: 0, scale: 1, transition: k.spring('snappy') },
      active: { rotate: 90, scale: [null, 0.78, 1], transition: { rotate: k.spring('snappy'), scale: seq(k, 'base', [0, 0.5, 1], ['exit', 'emphasized']) } },
    },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      <m.g variants={v.cross} style={origin(12, 12)}>
        <path d="M12 8.25 V15.75" />
        <path d="M8.25 12 H15.75" />
      </m.g>
    </>
  ),
})
