'use client'

import { IsoBox, IsoPlatform, IsoScene, useIsoPoint } from '@youj/illustrations'
import { toneColor } from '../../../lib/utils'
import type { BinRackBin, BinRackPart, BinRackState } from './data'
import { binCell, fillOf } from './model'

/* The rack as an isometric drawing: two rows of open cells on a plinth, each
 * holding a block as tall as its stock is full, in its part's color. A low bin
 * is warning-colored and an empty one is a dashed danger outline where the
 * block was. The picked bin stays at full strength and wears a tag with how
 * much is left and when it runs out; the rest recede. The drawing is
 * decorative: the bin list beside it carries every bin in words. */

const PITCH = 1.6
const CELL = 1.1
const PLATE = 0.5
const INSET = 0.35

/** A color toward the card's surface: the receding blocks stay solid, so nothing shows through them. */
const soften = (color: string) => `color-mix(in oklab, ${color} 50%, var(--color-surface))`

const TEXT = {
  paintOrder: 'stroke',
  stroke: 'var(--color-surface)',
  strokeWidth: 'calc(4px * var(--kg-px, 1))',
  strokeLinejoin: 'round',
  fontFamily: 'var(--font-sans)',
} as const

/** The tag stands above the whole rack: a dashed leader runs straight up from the bin's top to a lane clear of every cell, where its two lines sit. */
function Tag({ x, y, z, align, first, second }: { x: number; y: number; z: number; align: 'start' | 'middle' | 'end'; first: string; second: string }) {
  const [px, py] = useIsoPoint(x, y, z)
  const [, top] = useIsoPoint(INSET, INSET, PLATE + CELL)
  const lane = top - 14
  const nudge = align === 'start' ? -6 : align === 'end' ? 6 : 0
  return (
    <g aria-hidden>
      <line x1={px} y1={py} x2={px} y2={lane} className="kg-line" style={{ stroke: 'var(--color-fg-muted)', strokeDasharray: 'calc(3px * var(--kg-px, 1)) calc(3px * var(--kg-px, 1))' }} />
      <text x={px + nudge} y={lane - 18} textAnchor={align} style={{ ...TEXT, fill: 'var(--color-fg)', fontSize: 'calc(12px * var(--kg-px, 1))', fontWeight: 500 }}>
        {first}
      </text>
      <text x={px + nudge} y={lane - 4} textAnchor={align} style={{ ...TEXT, fill: 'var(--color-fg-muted)', fontSize: 'calc(11.5px * var(--kg-px, 1))' }}>
        {second}
      </text>
    </g>
  )
}

interface RackProps {
  bins: BinRackBin[]
  parts: BinRackPart[]
  states: BinRackState[]
  selected: string
  tag: (bin: BinRackBin) => [first: string, second: string]
  onSelect: (id: string) => void
}

export function Rack({ bins, parts, states, selected, tag, onSelect }: RackProps) {
  const cols = Math.max(1, Math.ceil(bins.length / 2))
  const lit = bins.findIndex((b) => b.id === selected)
  const at = (i: number) => {
    const { col, row } = binCell(i, bins.length)
    return { x: INSET + col * PITCH, y: INSET + row * PITCH, col }
  }
  const litBin = lit >= 0 ? bins[lit] : undefined
  const litAt = lit >= 0 ? at(lit) : undefined

  return (
    <IsoScene unit={32} pad={[56, 16, 6, 16]} grow>
      <IsoPlatform x={0} y={0} w={cols * PITCH + 0.3} d={2 * PITCH + 0.3} h={0.35} lip={0.15} inset={0.2} />
      {bins.flatMap((bin, i) => {
        const { x, y } = at(i)
        const state = states[i] ?? 'ok'
        const part = parts.find((p) => p.id === bin.part)
        const fill = fillOf(bin.quantity, bin.capacity)
        const dim = lit >= 0 && bin.id !== selected
        const color = state === 'low' ? 'var(--color-warning)' : toneColor(part?.tone ?? 'chart-1')
        const pointer = { onPointerEnter: () => onSelect(bin.id), onClick: () => onSelect(bin.id) }
        // Direct children of the scene (not a wrapper), so it can order them far to near and frame them.
        const cell = <IsoBox key={`${bin.id}-cell`} x={x} y={y} z={PLATE} w={CELL} d={CELL} h={CELL} variant={state === 'empty' ? 'ghost' : 'wire'} tone={state === 'empty' ? 'danger' : 'neutral'} {...pointer} />
        if (state === 'empty') return [cell]
        return [
          cell,
          <IsoBox
            key={`${bin.id}-stock`}
            x={x + 0.15}
            y={y + 0.15}
            z={PLATE}
            w={CELL - 0.3}
            d={CELL - 0.3}
            h={Math.max(0.2, fill * (CELL - 0.15))}
            color={dim ? soften(color) : color}
            {...pointer}
          />,
        ]
      })}
      {litBin && litAt && (
        <Tag
          x={litAt.x + CELL / 2}
          y={litAt.y + CELL / 2}
          z={PLATE + (states[lit] === 'empty' ? CELL : Math.max(0.2, fillOf(litBin.quantity, litBin.capacity) * (CELL - 0.15)))}
          align={litAt.col < cols / 3 ? 'start' : litAt.col >= (cols * 2) / 3 ? 'end' : 'middle'}
          first={tag(litBin)[0]}
          second={tag(litBin)[1]}
        />
      )}
    </IsoScene>
  )
}
