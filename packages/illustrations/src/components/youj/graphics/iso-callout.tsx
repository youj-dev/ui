'use client'

import type { CSSProperties } from 'react'
import { m, type MotionValue } from 'motion/react'
import { project, type ScreenPoint } from './iso'
import { useIsoScene, type IsoShape } from './iso-scene'
import { DASH } from './tones'

/* A callout: a hairline leader from a point on the drawing to a label at the
 * end of the line, like a technical drawing's. The label is a mono capital
 * eyebrow with a quieter detail line under it (dropped when the drawing is
 * shown small). Text keeps its CSS size at any scale (--kg-px), and reads
 * toward the end of the line: in RTL the leader runs left. */

/* A knockout halo in the surface color behind every label, so text stays
 * legible where it crosses the drawing's lines. Set --kg-halo on the scene
 * when it sits on another color. */
const HALO: CSSProperties = {
  paintOrder: 'stroke',
  stroke: 'var(--kg-halo, var(--color-surface))',
  strokeWidth: 'calc(4px * var(--kg-px, 1))',
  strokeLinejoin: 'round',
}
const TEXT: CSSProperties = {
  ...HALO,
  fontFamily: 'var(--font-mono)',
  fontSize: 'calc(11px * var(--kg-px, 1))',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
}
const DETAIL: CSSProperties = { ...HALO, fontFamily: 'var(--font-sans)', fontSize: 'calc(11.5px * var(--kg-px, 1))' }

export interface CalloutMarkProps {
  /** Where the leader starts, in user units. */
  from: ScreenPoint
  /** The x the leader runs to, in user units: the column labels line up on. */
  toX: number
  label: string
  detail?: string
  /** Emphasized: an accent leader and label. */
  lit?: boolean
  opacity?: MotionValue<number> | number
}

/** A leader and its label in user units (IsoStack draws its layers' callouts with it). */
export function CalloutMark({ from, toX, label, detail, lit, opacity = 1 }: CalloutMarkProps) {
  const { compact } = useIsoScene()
  const [x, y] = from
  const toEnd = toX >= x
  // The label sits a little past the leader's end, reading away from the drawing (SVG text has no CSS x, so a transform).
  const nudge: CSSProperties = { transform: `translateX(calc(${toEnd ? '' : '-'}8px * var(--kg-px, 1)))` }
  const ink = lit ? 'var(--color-accent)' : 'color-mix(in oklab, var(--color-fg) 30%, transparent)'
  const marks = (
    <>
      <line x1={x} y1={y} x2={toX} y2={y} className="kg-line" style={{ stroke: ink, strokeDasharray: lit ? undefined : DASH }} />
      <circle cx={x} cy={y} r={2} style={{ fill: lit ? 'var(--color-accent)' : 'var(--color-fg-subtle)', transform: 'scale(var(--kg-px, 1))', transformBox: 'fill-box', transformOrigin: 'center' }} />
      <text
        x={toX}
        y={y}
        dominantBaseline="middle"
        textAnchor={toEnd ? 'start' : 'end'}
        direction="ltr"
        style={{ ...TEXT, ...nudge, fill: lit ? 'var(--color-accent)' : 'var(--color-fg-muted)' }}
      >
        {label}
      </text>
      {detail && !compact && (
        <text
          x={toX}
          y={y}
          dy="1.45em"
          dominantBaseline="middle"
          textAnchor={toEnd ? 'start' : 'end'}
          direction="ltr"
          style={{ ...DETAIL, ...nudge, fill: 'var(--color-fg-subtle)' }}
        >
          {detail}
        </text>
      )}
    </>
  )
  // A motion group only when the opacity moves.
  return typeof opacity === 'number' ? (
    <g data-slot="iso-callout" style={{ opacity }}>
      {marks}
    </g>
  ) : (
    <m.g data-slot="iso-callout" style={{ opacity }}>
      {marks}
    </m.g>
  )
}

export interface IsoCalloutProps {
  /** The point it marks, in grid units. */
  at: readonly [x: number, y: number, z: number]
  label: string
  detail?: string
  lit?: boolean
}

function IsoCalloutImpl({ at, label, detail, lit }: IsoCalloutProps) {
  const { unit, railX } = useIsoScene()
  return <CalloutMark from={project(at[0], at[1], at[2], unit)} toX={railX} label={label} detail={detail} lit={lit} />
}

/** A callout on any point of the drawing, its leader running to the scene's rail. Write it as a direct child of the scene, after the shapes. */
export const IsoCallout = Object.assign(IsoCalloutImpl, { isoRail: () => true }) as IsoShape<IsoCalloutProps>
