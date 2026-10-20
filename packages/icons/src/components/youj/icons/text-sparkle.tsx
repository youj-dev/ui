import { m } from 'motion/react'
import { createIcon, drawn, FULL_DRAW, origin, seq, type IconVariants } from './icon-base'

const LINES = ['M3.5 5.5 H20.5', 'M3.5 11.5 H16.5', 'M3.5 17.5 H11']
/* A sparkles star at the end of the short last line, where the cursor would be. */
const STAR = 'M18 13.75 C18.23 16.33 19.17 17.27 21.75 17.5 C19.17 17.73 18.23 18.67 18 21.25 C17.77 18.67 16.83 17.73 14.25 17.5 C16.83 17.27 17.77 16.33 18 13.75 Z'

/**
 * Rewrite with AI. Each line of text is taken back and written again, top to
 * bottom, and the star at the end of the paragraph turns a quarter as the
 * last line lands.
 */
export const TextSparkleIcon = createIcon({
  name: 'text-sparkle',
  category: 'ai',
  keywords: ['ai', 'rewrite', 'improve writing', 'summarize', 'generate text', 'assistant', 'magic', 'copy'],
  variants: (k): IconVariants => {
    const s = k.stagger('loose')
    return {
      ...Object.fromEntries(
        LINES.map((_, i) => [
          `l${i}`,
          {
            rest: drawn(k),
            active: {
              pathLength: [null, 0, FULL_DRAW],
              opacity: [null, 0, 1],
              transition: seq(k, 'slow', [0, 0.3, 1], ['exit', 'emphasized'], i * s),
            },
          },
        ]),
      ),
      star: {
        rest: { rotate: 90, transition: k.tween('base', 'enter') },
        active: { rotate: [0, 90], transition: { ...k.tween('slow', 'enter'), delay: 2 * s + k.duration('base') } },
      },
    }
  },
  render: (v) => (
    <>
      {LINES.map((d, i) => (
        <m.path key={d} d={d} variants={v[`l${i}`]} />
      ))}
      <m.path d={STAR} variants={v.star} style={origin(18, 17.5)} />
    </>
  ),
})
