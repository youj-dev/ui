import { m } from 'motion/react'
import { after, createIcon, drawOut, drawn, origin } from './icon-base'

/* Shares cloud-upload's cloud: only the two ends of the base move. */
const OPEN = 'M8 16.5 H7 A3 3 0 0 1 6.73 10.51 A5 5 0 1 1 16.48 8.53 A4 4 0 1 1 17 16.5 H16'
const SEALED = 'M12 16.5 H7 A3 3 0 0 1 6.73 10.51 A5 5 0 1 1 16.48 8.53 A4 4 0 1 1 17 16.5 H12'

/** Download → downloaded. The arrow drops out through the base, the cloud seals behind it, and a check is written inside. `active` = downloaded. */
export const CloudDownloadIcon = createIcon({
  name: 'cloud-download',
  category: 'files',
  keywords: ['download', 'cloud', 'sync', 'offline', 'downloaded', 'save'],
  states: ['download', 'downloaded'],
  variants: (k) => {
    const fast = k.duration('fast')
    return {
      arrow: {
        rest: { y: 0, opacity: 1, transition: { y: after(k, fast, 'slow', 'enter'), opacity: after(k, fast, 'base') } },
        active: { y: 7, opacity: 0, transition: { y: k.tween('slow', 'exit'), opacity: k.tween('base', 'exit') } },
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
        <path d="M12 10.5 V21" />
        <path d="M9.5 18.5 L12 21 L14.5 18.5" />
      </m.g>
    </>
  ),
})
