import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* Folding a panel about its crease foreshortens it: the outer edge slides
 * toward the crease while every point keeps its height. */
const PANELS = {
  left: { open: 'M9 4 L3 6.5 V20 L9 17.5', folded: 'M9 4 L7.5 6.5 V20 L9 17.5' },
  right: { open: 'M15 6.5 L21 4 V17.5 L15 20', folded: 'M15 6.5 L16.5 4 V17.5 L15 20' },
}

/** Unfolding: both side panels fold in toward the middle one, then open back out flat, the right a beat behind the left. */
export const MapIcon = createIcon({
  name: 'map',
  category: 'location',
  keywords: ['directions', 'atlas', 'navigation', 'terrain', 'fold', 'explore'],
  variants: (k) => {
    const fold = ({ open, folded }: { open: string; folded: string }, delay: number) => ({
      rest: { d: open, transition: k.tween('base') },
      active: { d: [null, folded, folded, open], transition: seq(k, 'deliberate', [0, 0.3, 0.42, 1], ['exit', 'linear', 'emphasized'], delay) },
    })
    return { left: fold(PANELS.left, 0), right: fold(PANELS.right, k.stagger('base')) }
  },
  render: (v) => (
    <>
      <path d="M9 4 L15 6.5 V20 L9 17.5 Z" />
      <m.path d={PANELS.left.open} variants={v.left} />
      <m.path d={PANELS.right.open} variants={v.right} />
    </>
  ),
})
