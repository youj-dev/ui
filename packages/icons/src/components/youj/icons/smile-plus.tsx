import { m } from 'motion/react'
import { after, createIcon, origin } from './icon-base'

/* The face is an r8.5 ring of four cubics left open at the top right for the
 * plus; reacted, the same four cubics close the ring. The smile's cubics
 * widen and deepen into a grin. */
const FACE_OPEN = 'M19.21 10.8 C20.21 14.52 18.58 18.44 15.25 20.36 C11.92 22.28 7.71 21.73 4.99 19.01 C2.27 16.29 1.72 12.08 3.64 8.75 C5.56 5.42 9.48 3.79 13.2 4.79'
const FACE_FULL = 'M17.01 6.99 C20.33 10.31 20.33 15.69 17.01 19.01 C13.69 22.33 8.31 22.33 4.99 19.01 C1.67 15.69 1.67 10.31 4.99 6.99 C8.31 3.67 13.69 3.67 17.01 6.99'
const SMILE = 'M8 15.5 C9 16.83 10 17.5 11 17.5 C12 17.5 13 16.83 14 15.5'
const GRIN = 'M7.5 15 C8.67 17 9.83 18 11 18 C12.17 18 13.33 17 14.5 15'

/**
 * React ↔ reacted, for emoji reactions. The plus spins away, the face closes
 * its ring where the plus was and the smile widens into a grin; removing the
 * reaction opens the ring and spins the plus back in. `active` = reacted.
 */
export const SmilePlusIcon = createIcon({
  name: 'smile-plus',
  category: 'people',
  keywords: ['reaction', 'emoji', 'react', 'add reaction', 'smile', 'feedback', 'comment'],
  states: ['react', 'reacted'],
  variants: (k) => {
    const lag = k.duration('fast')
    return {
      plus: {
        rest: { scale: 1, rotate: 0, transition: after(k, lag, 'base', 'enter') },
        active: { scale: 0, rotate: 90, transition: k.tween('fast', 'exit') },
      },
      face: {
        rest: { d: FACE_OPEN, transition: k.tween('base', 'emphasized') },
        active: { d: FACE_FULL, transition: after(k, lag * 0.5, 'slow', 'emphasized') },
      },
      mouth: {
        rest: { d: SMILE, transition: k.tween('base') },
        active: { d: GRIN, transition: { ...k.spring('settle'), delay: lag + k.duration('base') * 0.5 } },
      },
    }
  },
  render: (v) => (
    <>
      <m.path d={FACE_OPEN} variants={v.face} />
      <path d="M8.5 10.5 h.01 M13.5 10.5 h.01" strokeWidth={2} />
      <m.path d={SMILE} variants={v.mouth} />
      <m.path d="M19 2.5 V7.5 M16.5 5 H21.5" variants={v.plus} style={origin(19, 5)} />
    </>
  ),
})
