import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** A new row is on its way: the plus turns a quarter with a small press and the short lines reach out to make room. */
export const ListPlusIcon = createIcon({
  name: 'list-plus',
  category: 'editor',
  keywords: ['add to list', 'new item', 'append', 'playlist add', 'insert row', 'queue'],
  variants: (k) => {
    const reach = (i: number) => ({
      rest: { scaleX: 1, transition: k.tween('fast') },
      active: { scaleX: [1, 1.12, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], i * k.stagger('base')) },
    })
    return {
      cross: {
        rest: { rotate: 0, scale: 1, transition: k.spring('snappy') },
        active: { rotate: 90, scale: [null, 0.78, 1], transition: { rotate: k.spring('snappy'), scale: seq(k, 'base', [0, 0.5, 1], ['exit', 'emphasized']) } },
      },
      l1: reach(0),
      l2: reach(1),
    }
  },
  render: (v) => (
    <>
      <path d="M3.5 6 H20.5" />
      <m.path d="M3.5 12 H12.5" variants={v.l1} style={origin(3.5, 12)} />
      <m.path d="M3.5 18 H10" variants={v.l2} style={origin(3.5, 18)} />
      <m.g variants={v.cross} style={origin(17, 16.5)}>
        <path d="M17 13 V20" />
        <path d="M13.5 16.5 H20.5" />
      </m.g>
    </>
  ),
})
