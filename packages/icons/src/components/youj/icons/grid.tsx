import { m } from 'motion/react'
import { after, createIcon, type IconVariants } from './icon-base'

/* A 16-unit canvas (2.5 corners) cut in thirds. Hidden, the grid is its four
 * crossings, marked as dots. Shown, each dot grows both ways into one grid
 * line through it: the top-left and bottom-right dots run vertical, the other
 * two horizontal. */
const LINES = [
  ['M9.5 9.5 L9.5 9.51', 'M9.5 4 L9.5 20'],
  ['M14.5 9.5 L14.51 9.5', 'M4 9.5 L20 9.5'],
  ['M14.5 14.5 L14.5 14.51', 'M14.5 4 L14.5 20'],
  ['M9.5 14.5 L9.51 14.5', 'M4 14.5 L20 14.5'],
] as const

/**
 * Grid hidden ↔ shown, for canvases and layout guides. Each crossing dot
 * stretches out both ways to the frame, one after another round the grid;
 * hiding draws the lines back into their dots. `active` = shown.
 */
export const GridIcon = createIcon({
  name: 'grid',
  category: 'editor',
  keywords: ['grid', 'guides', 'layout grid', 'snap', 'canvas', 'show grid', 'table', 'grid-3x3'],
  states: ['hidden', 'shown'],
  variants: (k): IconVariants => {
    const s = k.stagger('base')
    const last = LINES.length - 1
    return Object.fromEntries(
      LINES.map(([dot, line], i) => [
        `g${i}`,
        {
          rest: { d: dot, transition: after(k, (last - i) * s * 0.5, 'base') },
          active: { d: line, transition: after(k, i * s, 'slow', 'emphasized') },
        },
      ]),
    )
  },
  render: (v) => (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2.5" />
      {LINES.map(([dot], i) => (
        <m.path key={dot} d={dot} variants={v[`g${i}`]} />
      ))}
    </>
  ),
})
