import { m } from 'motion/react'
import { createIcon, seq } from './icon-base'

/* One wavelength of cloth sampled at four phases of a traveling wave. Both
 * the pole edge and the tip stay put; the ripple runs between them. */
const WAVE = [
  'M5 4.5 C7.33 3.32 9.67 3.32 12 4.5 C14.33 5.68 16.67 5.68 19 4.5 V13.5 C16.67 14.68 14.33 14.68 12 13.5 C9.67 12.32 7.33 12.32 5 13.5 Z',
  'M5 4.5 C7.33 4.5 9.67 2.25 12 2.25 C14.33 2.25 16.67 4.5 19 4.5 V13.5 C16.67 13.5 14.33 11.25 12 11.25 C9.67 11.25 7.33 13.5 5 13.5 Z',
  'M5 4.5 C7.33 5.68 9.67 5.68 12 4.5 C14.33 3.32 16.67 3.32 19 4.5 V13.5 C16.67 12.32 14.33 12.32 12 13.5 C9.67 14.68 7.33 14.68 5 13.5 Z',
  'M5 4.5 C7.33 4.5 9.67 6.75 12 6.75 C14.33 6.75 16.67 4.5 19 4.5 V13.5 C16.67 13.5 14.33 15.75 12 15.75 C9.67 15.75 7.33 13.5 5 13.5 Z',
]
const [REST] = WAVE as [string, ...string[]]

/**
 * Unflagged ↔ flagged. A ripple runs through the cloth from the pole to the
 * tip while it fills from the pole outward; unflagging runs the ripple
 * again as the fill drains back to the pole. `active` = flagged.
 */
export const FlagIcon = createIcon({
  name: 'flag',
  category: 'system',
  keywords: ['report', 'mark', 'milestone', 'goal', 'flagged', 'bookmark'],
  states: ['unflagged', 'flagged'],
  variants: (k) => {
    const ripple = {
      d: [null, WAVE[1]!, WAVE[2]!, WAVE[3]!, REST],
      transition: seq(k, 'deliberate', [0, 0.25, 0.5, 0.75, 1], ['standard', 'linear', 'linear', 'standard']),
    }
    return {
      cloth: { rest: ripple, active: ripple },
      fill: {
        rest: { ...ripple, clipPath: 'inset(0% 100% 0% 0%)', transition: { ...ripple.transition, clipPath: k.tween('slow', 'standard') } },
        active: { ...ripple, clipPath: 'inset(0% 0% 0% 0%)', transition: { ...ripple.transition, clipPath: k.tween('deliberate', 'emphasized') } },
      },
    }
  },
  render: (v) => (
    <>
      <path d="M5 21.5 V3" />
      <m.path d={REST} fill="currentColor" stroke="none" variants={v.fill} />
      <m.path d={REST} variants={v.cloth} />
    </>
  ),
})
