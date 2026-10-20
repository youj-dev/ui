import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** Align right. Both objects drift off the guide, the short one a beat behind, and snap back against it. */
export const AlignEndVerticalIcon = createIcon({
  name: 'align-end-vertical',
  category: 'editor',
  keywords: ['align', 'align right', 'right', 'end', 'objects', 'layers', 'layout', 'design', 'align-end-vertical'],
  variants: (k) => {
    const snap = (delay: number) => ({
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, -3, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], delay) },
    })
    return { a: snap(0), b: snap(k.stagger('loose')) }
  },
  render: (v) => (
    <>
      <path d="M20 3 V21" />
      <m.rect x="4" y="5.5" width="13" height="5" rx="1.5" variants={v.a} />
      <m.rect x="9" y="13.5" width="8" height="5" rx="1.5" variants={v.b} />
    </>
  ),
})
