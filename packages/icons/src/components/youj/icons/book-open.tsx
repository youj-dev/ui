import { m } from 'motion/react'
import { after, createIcon, origin, seqFor } from './icon-base'

/* Two pages that rise from the spine to their outer edges, top and bottom.
 * The turning leaf is the right page's own outline, flipped across the spine. */
const LEFT = 'M12 6.75 C10.25 5.25 7.75 4.75 3.5 5 V17.75 C7.75 17.5 10.25 18 12 19.5'
const RIGHT = 'M12 6.75 C13.75 5.25 16.25 4.75 20.5 5 V17.75 C16.25 17.5 13.75 18 12 19.5'

/** Reading. A page lifts off the right, turns over the spine and settles onto the left. */
export const BookOpenIcon = createIcon({
  name: 'book-open',
  category: 'files',
  keywords: ['docs', 'documentation', 'read', 'guide', 'manual', 'knowledge', 'learn', 'book', 'library', 'book-open'],
  variants: (k) => {
    const length = k.duration('deliberate') * 1.15
    return {
      leaf: {
        // Leaving mid-turn fades the leaf out where it is, then puts it back unseen.
        rest: {
          scaleX: 1,
          y: 0,
          opacity: 0,
          transition: { opacity: k.tween('fast'), scaleX: after(k, k.duration('fast'), 'instant'), y: after(k, k.duration('fast'), 'instant') },
        },
        active: {
          scaleX: [1, -1],
          y: [0, -0.9, 0],
          opacity: [0, 1, 1, 0],
          transition: {
            scaleX: seqFor(k, length, [0, 1], ['emphasized']),
            y: seqFor(k, length, [0, 0.5, 1], ['standard', 'standard']),
            opacity: seqFor(k, length, [0, 0.08, 0.9, 1], ['linear', 'linear', 'linear']),
          },
        },
      },
    }
  },
  render: (v) => (
    <>
      <path d={LEFT} />
      <path d={RIGHT} />
      <path d="M12 6.75 V19.5" />
      <m.path d={RIGHT} variants={v.leaf} style={origin(12, 12)} />
    </>
  ),
})
