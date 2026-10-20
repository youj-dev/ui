import { m } from 'motion/react'
import { createIcon, after } from './icon-base'

/* Each bracket is eight cubic segments in both shapes, split in proportion to
 * the brace's own segments, so the angle bends into the brace point for point. */
const ANGLE_L =
  'M8 6.5 C7.91 6.59 7.83 6.67 7.74 6.76 C7.21 7.29 6.68 7.82 6.14 8.36 C5.46 9.04 4.78 9.72 4.1 10.4 C3.57 10.93 3.03 11.47 2.5 12 C3.03 12.53 3.57 13.07 4.1 13.6 C4.78 14.28 5.46 14.96 6.14 15.64 C6.68 16.18 7.21 16.71 7.74 17.24 C7.83 17.33 7.91 17.41 8 17.5'
const ANGLE_R =
  'M16 6.5 C16.09 6.59 16.17 6.67 16.26 6.76 C16.79 7.29 17.32 7.82 17.86 8.36 C18.54 9.04 19.22 9.72 19.9 10.4 C20.43 10.93 20.97 11.47 21.5 12 C20.97 12.53 20.43 13.07 19.9 13.6 C19.22 14.28 18.54 14.96 17.86 15.64 C17.32 16.18 16.79 16.71 16.26 17.24 C16.17 17.33 16.09 17.41 16 17.5'
const BRACE_L =
  'M9 4 C8.83 4 8.67 4 8.5 4 C7.4 4 6.5 4.9 6.5 6 C6.5 7.33 6.5 8.67 6.5 10 C6.5 11.1 5.6 12 4.5 12 C5.6 12 6.5 12.9 6.5 14 C6.5 15.33 6.5 16.67 6.5 18 C6.5 19.1 7.4 20 8.5 20 C8.67 20 8.83 20 9 20'
const BRACE_R =
  'M15 4 C15.17 4 15.33 4 15.5 4 C16.6 4 17.5 4.9 17.5 6 C17.5 7.33 17.5 8.67 17.5 10 C17.5 11.1 18.4 12 19.5 12 C18.4 12 17.5 12.9 17.5 14 C17.5 15.33 17.5 16.67 17.5 18 C17.5 19.1 16.6 20 15.5 20 C15.33 20 15.17 20 15 20'

/**
 * Code ↔ JSON. The angle brackets draw inward and soften into curly braces,
 * the right one a beat behind the left; reverting straightens them out again.
 * `active` = braces.
 */
export const CodeIcon = createIcon({
  name: 'code',
  category: 'development',
  keywords: ['source', 'developer', 'html', 'markup', 'json', 'embed', 'programming'],
  states: ['code', 'json'],
  variants: (k) => {
    const morph = (from: string, to: string, delay: number) => ({
      rest: { d: from, transition: after(k, delay, 'base', 'standard') },
      active: { d: to, transition: after(k, delay, 'slow', 'emphasized') },
    })
    return {
      left: morph(ANGLE_L, BRACE_L, 0),
      right: morph(ANGLE_R, BRACE_R, k.stagger('base')),
    }
  },
  render: (v) => (
    <>
      <m.path d={ANGLE_L} variants={v.left} />
      <m.path d={ANGLE_R} variants={v.right} />
    </>
  ),
})
