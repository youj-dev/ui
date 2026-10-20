import { m } from 'motion/react'
import { createIcon, drawIn, drawn } from './icon-base'

/** Connecting: the links between the three nodes are drawn in turn round the mesh. */
export const NetworkIcon = createIcon({
  name: 'network',
  category: 'development',
  keywords: ['mesh', 'nodes', 'topology', 'connections', 'graph', 'peers', 'distributed'],
  variants: (k) => ({
    e0: { rest: drawn(k), active: drawIn(k, 'base', 0, 'standard') },
    e1: { rest: drawn(k), active: drawIn(k, 'base', k.stagger('loose'), 'standard') },
    e2: { rest: drawn(k), active: drawIn(k, 'base', k.stagger('loose') * 2, 'standard') },
  }),
  render: (v) => (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5.5" cy="17.5" r="2.5" />
      <circle cx="18.5" cy="17.5" r="2.5" />
      <m.path d="M10.39 8.11 L7.11 14.39" variants={v.e0} />
      <m.path d="M13.61 8.11 L16.89 14.39" variants={v.e1} />
      <m.path d="M9 17.5 L15 17.5" variants={v.e2} />
    </>
  ),
})
