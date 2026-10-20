import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

const REAR = 'M6 6 L12 12 L18 6'
const LEAD = 'M6 12 L12 18 L18 12'

/** Both chevrons push down: the rear one catches up with the lead, the pair holds a beat, then they part again. */
export const ChevronsDownIcon = createIcon({
  name: 'chevrons-down',
  category: 'arrows',
  keywords: ['expand', 'scroll down', 'bottom', 'lower', 'more', 'double chevron'],
  variants: (k) => ({
    lead: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 2, 2, 0], transition: seq(k, 'deliberate', [0, 0.34, 0.62, 1], ['standard', 'linear', 'emphasized']) },
    },
    rear: {
      rest: { y: 0, transition: k.tween('fast') },
      active: { y: [null, 5, 5, 0], transition: seq(k, 'deliberate', [0, 0.44, 0.62, 1], ['emphasized', 'linear', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <m.path d={REAR} variants={v.rear} />
      <m.path d={LEAD} variants={v.lead} />
    </>
  ),
})
