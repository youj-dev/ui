import { m } from 'motion/react'
import { createIcon, seq, type IconVariants } from './icon-base'

/* A rounded panel as one path, so a panel can resize point for point. */
const f = (n: number) => +n.toFixed(2)
function panel(x: number, y: number, w: number, h: number, r = 1.5) {
  return `M${f(x + r)} ${f(y)} H${f(x + w - r)} A${r} ${r} 0 0 1 ${f(x + w)} ${f(y + r)} V${f(y + h - r)} A${r} ${r} 0 0 1 ${f(x + w - r)} ${f(y + h)} H${f(x + r)} A${r} ${r} 0 0 1 ${f(x)} ${f(y + h - r)} V${f(y + r)} A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)} Z`
}

/* Two stat cards over a chart and a side list, on three-unit gutters. When
 * the layout reflows the rows trade heights: the cards grow into the room the
 * chart and the list give up. */
const TOP = 5
const BOTTOM = 10
const PANELS = [
  { x: 3, w: 7.5, top: true },
  { x: 13.5, w: 7.5, top: true },
  { x: 3, w: 10, top: false },
  { x: 16, w: 5, top: false },
] as const
const shape = (p: (typeof PANELS)[number], traded: boolean) =>
  p.top ? panel(p.x, 3, p.w, traded ? BOTTOM : TOP) : panel(p.x, traded ? 3 + BOTTOM + 3 : 3 + TOP + 3, p.w, traded ? TOP : BOTTOM)

/**
 * Dashboard. The layout reflows once: the chart row sinks and the stat cards
 * grow into the space it leaves, then the cards give it back and the chart
 * row rises into place. The gutters never close.
 */
export const LayoutDashboardIcon = createIcon({
  name: 'layout-dashboard',
  category: 'navigation',
  keywords: ['dashboard', 'overview', 'home', 'panels', 'widgets', 'analytics', 'layout', 'cards'],
  variants: (k): IconVariants =>
    Object.fromEntries(
      PANELS.map((p, i) => {
        const rest = shape(p, false)
        const traded = shape(p, true)
        // The bottom row moves first on the way out and last on the way back, so the rows never meet.
        const d = p.top ? [null, rest, traded, traded, rest, rest] : [null, traded, traded, traded, rest]
        const times = p.top ? [0, 0.12, 0.46, 0.58, 0.88, 1] : [0, 0.36, 0.5, 0.7, 1]
        const eases = p.top ? (['linear', 'emphasized', 'linear', 'emphasized', 'linear'] as const) : (['emphasized', 'linear', 'linear', 'emphasized'] as const)
        const stagger = p.x > 10 ? k.stagger('tight') : 0
        return [
          `p${i}`,
          {
            rest: { d: rest, transition: k.tween('base') },
            active: { d, transition: seq(k, 'deliberate', times, [...eases], stagger) },
          },
        ]
      }),
    ),
  render: (v) => (
    <>
      {PANELS.map((p, i) => (
        <m.path key={i} d={shape(p, false)} variants={v[`p${i}`]} />
      ))}
    </>
  ),
})
