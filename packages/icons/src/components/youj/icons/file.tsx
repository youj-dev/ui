import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* A real fold. The flap's free corner travels in a straight line from the page
 * corner (flat) to its mirror image across the crease (folded); the outline's
 * corner vertex rides to the crease with it, so both paths share one structure. */
const FOLDED = {
  outline: 'M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 L16.5 5.5 Z',
  flap: 'M14 3 L14 8 L19 8',
}
const FLAT = {
  outline: 'M14 3 H7 A2 2 0 0 0 5 5 V19 A2 2 0 0 0 7 21 H17 A2 2 0 0 0 19 19 V8 L19 3 Z',
  flap: 'M14 3 L19 3 L19 8',
}

/** The dog-ear flicks up flat and falls back into its fold. */
export const FileIcon = createIcon({
  name: 'file',
  category: 'files',
  keywords: ['document', 'page', 'paper', 'doc', 'blank', 'sheet'],
  variants: (k) => {
    const flick = seq(k, 'deliberate', [0, 0.36, 1], ['standard', 'emphasized'])
    return {
      outline: {
        rest: { d: FOLDED.outline, transition: k.tween('fast') },
        active: { d: [FOLDED.outline, FLAT.outline, FOLDED.outline], transition: flick },
      },
      flap: {
        rest: { d: FOLDED.flap, transition: k.tween('fast') },
        active: { d: [FOLDED.flap, FLAT.flap, FOLDED.flap], transition: flick },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d={FOLDED.outline} variants={v.outline} />
      <m.path d={FOLDED.flap} variants={v.flap} />
    </>
  ),
})
