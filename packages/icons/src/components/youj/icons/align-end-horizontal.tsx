import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Align bottom. Both objects lift off the guide, the short one a beat behind, and snap back down against it. */
export const AlignEndHorizontalIcon = createIcon({
  name: 'align-end-horizontal',
  category: 'editor',
  keywords: ['align', 'align bottom', 'bottom', 'end', 'objects', 'layers', 'layout', 'design', 'align-end-horizontal'],
  variants: (k) => {
    const snap = (delay: number) => ({
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, -3, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], delay) },
    })
    return { a: snap(0), b: snap(k.stagger('loose')) }
  },
  render: (v) => (
    <>
      <path d="M3 20 H21" />
      <m.rect x="5.5" y="4" width="5" height="13" rx="1.5" variants={v.a} />
      <m.rect x="13.5" y="9" width="5" height="8" rx="1.5" variants={v.b} />
    </>
  ),
})
