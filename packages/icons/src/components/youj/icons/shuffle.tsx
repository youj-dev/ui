import { m } from 'motion/react'
import { createIcon, drawIn, drawn, hidden, seq } from './icon-base'

/**
 * Re-deal. Both routes are redrawn from the left at once, crossing mid-way
 * (the broken one picks up again past the crossing), and each head is pushed
 * out as its route arrives.
 */
export const ShuffleIcon = createIcon({
  name: 'shuffle',
  category: 'arrows',
  keywords: ['random', 'mix', 'shuffle play', 'crossing', 'order', 'music'],
  variants: (k) => {
    const d = k.duration('slow')
    const head = (delay: number) => ({
      from: { opacity: 0 },
      rest: { x: 0, opacity: 1, transition: k.tween('fast') },
      active: { x: [-3, -3, 0], opacity: [0, 0, 1], transition: seq(k, 'slow', [0, 0.4, 1], ['linear', 'emphasized'], delay) },
    })
    return {
      rise: { from: hidden, rest: drawn(k), active: drawIn(k, 'slow', 0, 'standard') },
      fallA: { from: hidden, rest: drawn(k), active: drawIn(k, 'fast', 0, 'linear') },
      fallB: { from: hidden, rest: drawn(k), active: drawIn(k, 'fast', d * 0.55, 'standard') },
      headRise: head(0),
      headFall: head(k.stagger('base')),
    }
  },
  render: (v) => (
    <>
      <m.path d="M3 17 H7 L17 7 H21" variants={v.rise} />
      <m.path d="M17.5 3.5 L21 7 L17.5 10.5" variants={v.headRise} />
      <m.path d="M3 7 H7 L9.5 9.5" variants={v.fallA} />
      <m.path d="M14.5 14.5 L17 17 H21" variants={v.fallB} />
      <m.path d="M17.5 13.5 L21 17 L17.5 20.5" variants={v.headFall} />
    </>
  ),
})
