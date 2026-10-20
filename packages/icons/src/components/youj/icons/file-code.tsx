import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/** A source file. The angle brackets spread apart and snap back, the right one a beat behind. */
export const FileCodeIcon = createIcon({
  name: 'file-code',
  category: 'files',
  keywords: ['source file', 'code', 'script', 'program', 'html', 'tsx', 'developer', 'file-code', 'file-code-2'],
  variants: (k) => {
    const spread = (x: number, delay: number) => ({
      rest: { x: 0, transition: k.tween('fast') },
      active: { x: [null, x, 0], transition: seq(k, 'slow', [0, 0.4, 1], ['standard', 'emphasized'], delay) },
    })
    return { left: spread(-1, 0), right: spread(1, k.stagger('base')) }
  },
  render: (v) => (
    <>
      <path d="M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 Z" />
      <path d="M14 3 V8 H19" />
      <m.path d="M10 12 L7.5 14.5 L10 17" variants={v.left} />
      <m.path d="M14 12 L16.5 14.5 L14 17" variants={v.right} />
    </>
  ),
})
