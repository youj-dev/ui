import { m } from 'motion/react'
import { createIcon, origin, seq } from './icon-base'

/** Growing: the stem stretches up out of the ground and each leaf unfurls from where it joins the stem, the lower one first. */
export const SproutIcon = createIcon({
  name: 'sprout',
  category: 'weather',
  keywords: ['sprout', 'grow', 'growth', 'plant', 'seedling', 'start', 'nature', 'new'],
  variants: (k) => {
    const unfurl = (delay: number) => ({
      rest: { scale: 1, transition: k.tween('base') },
      active: { scale: [null, 0.55, 1.08, 1], transition: seq(k, 'slow', [0, 0.3, 0.7, 1], ['exit', 'enter', 'standard'], delay) },
    })
    return {
      stem: {
        rest: { scaleY: 1, transition: k.tween('base') },
        active: { scaleY: [null, 0.8, 1], transition: seq(k, 'slow', [0, 0.35, 1], ['exit', 'emphasized']) },
      },
      low: unfurl(k.duration('fast')),
      high: unfurl(k.duration('fast') + k.stagger('loose')),
    }
  },
  render: (v) => (
    <>
      <m.g variants={v.stem} style={origin(12, 21)}>
        <path d="M12 21 V11" />
        <m.path d="M12 15 C12 11.5 9.5 9.5 5.5 9.5 C5.5 13 8 15 12 15 Z" variants={v.low} style={origin(12, 15)} />
        <m.path d="M12 12 C12 8 14.5 5.5 18.5 5.5 C18.5 9.5 16 12 12 12 Z" variants={v.high} style={origin(12, 12)} />
      </m.g>
      <path d="M7 21 H17" />
    </>
  ),
})
