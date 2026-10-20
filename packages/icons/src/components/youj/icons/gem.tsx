import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* The facets walk top-left tip, girdle, point, girdle, top-right tip. Turned,
 * the four upper points slide right along the table and the girdle while the
 * point stays, as if the stone were rotating in the light. */
const FACETS = 'M10 3.5 L8 9 L12 20.5 L16 9 L14 3.5'
const TURNED = 'M12.5 3.5 L11 9 L12 20.5 L18.5 9 L16 3.5'

/** Premium: the stone turns in the light, its facets sliding across the table and girdle and back. */
export const GemIcon = createIcon({
  name: 'gem',
  category: 'commerce',
  keywords: ['gem', 'diamond', 'premium', 'value', 'pro', 'jewel', 'rewards', 'loyalty'],
  variants: (k) => ({
    facets: {
      rest: { d: FACETS, transition: k.tween('base') },
      active: { d: [null, TURNED, FACETS], transition: seq(k, 'deliberate', [0, 0.45, 1], ['standard', 'emphasized']) },
    },
  }),
  render: (v) => (
    <>
      <path d="M6.5 3.5 H17.5 L21.5 9 L12 20.5 L2.5 9 Z" />
      <path d="M2.5 9 H21.5" />
      <m.path d={FACETS} variants={v.facets} />
    </>
  ),
})
