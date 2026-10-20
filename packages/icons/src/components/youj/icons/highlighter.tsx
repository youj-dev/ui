import { m } from 'motion/react'
import { createIcon, FULL_DRAW, drawn, seq } from './icon-base'

/* The marker is drawn upright with its chisel tip at (12, 21), then turned
 * 45° about the tip so the barrel leans up and to the right; the highlight
 * runs along the baseline to just short of the tip. */
const MARK = 'M3.5 21 H10.5'
const REACH = 6

/**
 * Highlighting a phrase: the marker lifts back along the line as the old
 * highlight is taken up, then sweeps forward and lays it down again.
 */
export const HighlighterIcon = createIcon({
  name: 'highlighter',
  category: 'editor',
  keywords: ['highlight', 'marker', 'annotate', 'emphasis', 'review', 'mark up', 'pen'],
  variants: (k) => {
    const t = seq(k, 'deliberate', [0, 0.35, 1], ['standard', 'emphasized'])
    return {
      marker: { rest: { x: 0, transition: k.tween('base') }, active: { x: [null, -REACH, 0], transition: t } },
      mark: { rest: drawn(k), active: { pathLength: [null, 0.15, FULL_DRAW], opacity: 1, transition: t } },
    }
  },
  render: (v) => (
    <>
      <m.path d={MARK} variants={v.mark} />
      <m.g variants={v.marker}>
        <g transform="rotate(45 12 21)">
          <path d="M9.5 16.5 V11.5 A1.5 1.5 0 0 1 11 10 H13 A1.5 1.5 0 0 1 14.5 11.5 V16.5 Z" />
          <path d="M9.5 16.5 L10.5 18.5 H13.5 L14.5 16.5 M10.75 18.5 L11.25 21 H12.75 L13.25 18.5" />
        </g>
      </m.g>
    </>
  ),
})
