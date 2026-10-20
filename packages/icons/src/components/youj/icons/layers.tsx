import { m } from 'motion/react'
import { createIcon } from './icon-base'

/** The stack fans open so each layer reads on its own, and closes again on release. */
export const LayersIcon = createIcon({
  name: 'layers',
  category: 'data',
  keywords: ['stack', 'levels', 'arrange', 'depth', 'overlay'],
  variants: (k) => ({
    top: { rest: { y: 0, transition: k.spring('smooth') }, active: { y: -2, transition: k.spring('smooth') } },
    bottom: { rest: { y: 0, transition: k.spring('smooth') }, active: { y: 2, transition: k.spring('smooth') } },
  }),
  render: (v) => (
    <>
      <m.path d="M12 3 L21 8 L12 13 L3 8 Z" variants={v.top} />
      <path d="M3 12 L12 17 L21 12" />
      <m.path d="M3 16 L12 21 L21 16" variants={v.bottom} />
    </>
  ),
})
