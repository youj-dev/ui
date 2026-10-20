'use client'

import { IsoBox, IsoScene, useIsoPoint } from '@youj/illustrations'
import { toneColor } from '../../../lib/utils'
import type { LossWaterfallLoss } from './data'
import { valueToHeight, waterfallSteps } from './math'

/* The day as an isometric waterfall: the start as the first, tall bar,
 * then one floating bar per loss, each hanging from where the last one left
 * the level, and what is left standing as the green bar at the end. The
 * selected loss is at full strength with a dashed leader to its figure; the
 * rest recede. The legend beside it is the text; this is the picture. */

const HEIGHT = 6
const WIDTH = 0.75
const DEPTH = 1.5
const PITCH = 1.4
const FLOOR = 0.2

/** A color toward the card's surface: the receding bars stay solid, so nothing shows through them. */
const soften = (color: string) => `color-mix(in oklab, ${color} 45%, var(--color-surface))`

function Leader({ x, z, text }: { x: number; z: number; text: string }) {
  const [px, py] = useIsoPoint(x, 0, z)
  return (
    <g aria-hidden>
      <line x1={px} y1={py} x2={px + 18} y2={py - 14} className="kg-line" style={{ stroke: 'var(--color-fg-muted)', strokeDasharray: 'calc(3px * var(--kg-px, 1)) calc(3px * var(--kg-px, 1))' }} />
      <text
        x={px + 22}
        y={py - 14}
        dominantBaseline="middle"
        style={{
          fill: 'var(--color-fg)',
          fontFamily: 'var(--font-sans)',
          fontSize: 'calc(12px * var(--kg-px, 1))',
          fontWeight: 500,
          paintOrder: 'stroke',
          stroke: 'var(--color-surface)',
          strokeWidth: 'calc(4px * var(--kg-px, 1))',
          strokeLinejoin: 'round',
        }}
      >
        {text}
      </text>
    </g>
  )
}

interface DrawingProps {
  start: number
  losses: LossWaterfallLoss[]
  selected: string
  label: string
  callout: string
}

export function Drawing({ start, losses, selected, label, callout }: DrawingProps) {
  const { steps } = waterfallSteps(start, losses)
  const height = (value: number) => valueToHeight(value, start, HEIGHT)
  const lit = steps.findIndex((s) => s.id === selected)
  return (
    <IsoScene title={label} unit={25} pad={[24, 64, 6, 8]} assemble>
      <IsoBox x={-0.4} y={-0.3} z={0} w={steps.length * PITCH + 0.2} d={DEPTH + 0.6} h={FLOOR} tone="sunken" />
      {steps.map((step, i) => {
        const loss = losses.find((l) => l.id === step.id)
        const dim = lit >= 0 && step.kind === 'loss' && step.id !== selected
        return (
          <IsoBox
            key={step.id}
            x={i * PITCH}
            y={0}
            z={FLOOR + height(step.bottom)}
            w={WIDTH}
            d={DEPTH}
            h={Math.max(height(step.top - step.bottom), 0.05)}
            tone={step.kind === 'result' ? 'success' : 'neutral'}
            color={loss ? (dim ? soften(toneColor(loss.tone)) : toneColor(loss.tone)) : step.kind === 'start' ? 'var(--color-fg-subtle)' : undefined}
          />
        )
      })}
      {lit >= 0 && <Leader x={lit * PITCH + WIDTH} z={FLOOR + height(steps[lit]!.top)} text={callout} />}
    </IsoScene>
  )
}
