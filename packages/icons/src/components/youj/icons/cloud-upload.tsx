import { m } from 'motion/react'
import { after, createIcon, drawOut, drawn, origin } from './icon-base'

/* One cloud path in both states. Only its two ends move: apart, they leave a gap
 * in the base for the arrow; together at the center, the base is sealed. */
const OPEN = 'M8 16.5 H7 A3 3 0 0 1 6.73 10.51 A5 5 0 1 1 16.48 8.53 A4 4 0 1 1 17 16.5 H16'
const SEALED = 'M12 16.5 H7 A3 3 0 0 1 6.73 10.51 A5 5 0 1 1 16.48 8.53 A4 4 0 1 1 17 16.5 H12'

/** Upload → uploaded. The arrow launches up through the cloud, the gap in its base seals, and a check is written inside. `active` = uploaded. */
export const CloudUploadIcon = createIcon({
  name: 'cloud-upload',
  category: 'files',
  keywords: ['upload', 'cloud', 'sync', 'backup', 'uploaded', 'storage'],
  states: ['upload', 'uploaded'],
  variants: (k) => {
    const fast = k.duration('fast')
    return {
      arrow: {
        rest: { y: 0, opacity: 1, transition: { y: after(k, fast, 'slow', 'enter'), opacity: after(k, fast, 'base') } },
        active: { y: -12, opacity: 0, transition: { y: k.tween('slow', 'exit'), opacity: k.tween('base', 'exit') } },
      },
      cloud: {
        rest: { d: OPEN, transition: k.tween('base') },
        active: { d: SEALED, transition: after(k, fast, 'base') },
      },
      check: {
        rest: { ...drawOut(k), scale: 1, transition: { ...drawOut(k).transition, scale: k.tween('fast') } },
        active: {
          ...drawn(k, 'slow', k.duration('base')),
          scale: [0.85, 1],
          transition: { ...drawn(k, 'slow', k.duration('base')).transition, scale: { ...k.spring('settle'), delay: k.duration('slow') } },
        },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d={OPEN} variants={v.cloud} />
      <m.path d="M9.5 12 L11.5 14 L15 10.5" variants={v.check} style={origin(12, 12)} />
      <m.g variants={v.arrow}>
        <path d="M12 20.5 V10.5" />
        <path d="M9.5 13 L12 10.5 L14.5 13" />
      </m.g>
    </>
  ),
})
