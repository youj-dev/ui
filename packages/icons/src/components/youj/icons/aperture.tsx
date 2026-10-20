import { m } from 'motion/react'
import { createIcon, type IconVariants } from './icon-base'

/* Six blades, each a chord running along one side of the hexagonal opening
 * out to the ring. Stopping down shrinks the opening's apothem from 4.25 to
 * 1.75 and turns it 20° as a real iris does; each blade's endpoints slide
 * along its side and round the ring. */
const BLADES = [
  ['M9.55 7.75 L19.93 7.75', 'M10.45 10.7 L19.7 7.34'],
  ['M14.45 7.75 L19.65 16.75', 'M12.35 10.01 L19.89 16.33'],
  ['M16.91 12 L11.71 21', 'M13.9 11.31 L12.19 21'],
  ['M14.45 16.25 L4.07 16.25', 'M13.55 13.3 L4.3 16.66'],
  ['M9.55 16.25 L4.35 7.25', 'M11.65 13.99 L4.11 7.67'],
  ['M7.09 12 L12.29 3', 'M10.1 12.69 L11.81 3'],
] as const

/**
 * Wide ↔ narrow. The iris closes down on its center, every blade sliding in
 * together as the opening turns; opening up draws them back to the rim.
 * `active` = narrow.
 */
export const ApertureIcon = createIcon({
  name: 'aperture',
  category: 'media',
  keywords: ['aperture', 'camera', 'lens', 'iris', 'shutter', 'photo', 'focus', 'exposure'],
  states: ['wide', 'narrow'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      BLADES.map(([wide, narrow], i) => [
        `b${i}`,
        {
          rest: { d: wide, transition: k.tween('slow', 'emphasized') },
          active: { d: narrow, transition: k.tween('slow', 'emphasized') },
        },
      ]),
    ),
  render: (v) => (
    <>
      <circle cx="12" cy="12" r="9" />
      {BLADES.map(([wide], i) => (
        <m.path key={wide} d={wide} variants={v[`b${i}`]} />
      ))}
    </>
  ),
})
