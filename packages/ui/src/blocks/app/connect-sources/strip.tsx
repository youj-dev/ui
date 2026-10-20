'use client'

import { IsoBox, IsoScene, useIsoPoint } from '@youj/illustrations'
import { toneColor } from '../../../lib/utils'
import type { DataSource } from './data'

/* The sources as blocks feeding a hub in the isometric kit: a long hub at
 * the back, one block per source standing in front of it, and a channel
 * between them. A connected source is a block in its color with a lit
 * channel and a lit lamp on the hub; the backfilling one hovers over its
 * pad on a dashed drop line; the free ones stand gray with an empty channel.
 * Decorative: the tiles beside it say the same in words. */

/** The layout, in grid units: the pitch and first block's center, the hub's depth and height, and where the blocks stand. */
const PITCH = 1.7
const FIRST = 0.8
const HUB = { d: 1.1, h: 0.95 }
const ROW = 2.5
const BLOCK = 0.6
const CHANNEL = { w: 0.22, h: 0.1 }
/** How high the backfilling block floats over its pad. */
const HOVER = 0.9

/** The dashed line a hovering block will drop along. */
function Drop({ x, y, from, to }: { x: number; y: number; from: number; to: number }) {
  const [ax, ay] = useIsoPoint(x, y, from)
  const [bx, by] = useIsoPoint(x, y, to)
  return <line aria-hidden x1={ax} y1={ay} x2={bx} y2={by} className="kg-line kg-dash" style={{ stroke: 'var(--color-fg-subtle)' }} />
}

export function Strip({ sources }: { sources: DataSource[] }) {
  const length = FIRST * 2 + PITCH * Math.max(0, sources.length - 1)
  return (
    <IsoScene unit={30} pad={[24, 24, 16, 24]} assemble>
      <IsoBox x={0} y={0} z={0} w={length} d={HUB.d} h={HUB.h} tone="raised" />
      <IsoBox x={0.25} y={0.2} z={HUB.h} w={length - 0.5} d={HUB.d - 0.4} h={0.08} tone="neutral" />
      {sources.map((source, i) => {
        const cx = FIRST + i * PITCH
        const color = toneColor(source.tone)
        const lit = source.status === 'connected' || source.status === 'backfilling' ? color : undefined
        return [
          <IsoBox key={`${source.id}-lamp`} x={cx - 0.12} y={0.4} z={HUB.h + 0.08} w={0.24} d={0.24} h={0} tone="sunken" color={lit} />,
          <IsoBox
            key={`${source.id}-channel`}
            x={cx - CHANNEL.w / 2}
            y={HUB.d}
            z={0}
            w={CHANNEL.w}
            d={ROW - HUB.d - 0.08}
            h={CHANNEL.h}
            tone="sunken"
            color={source.status === 'connected' ? color : undefined}
          />,
          <IsoBox key={`${source.id}-pad`} x={cx - BLOCK / 2 - 0.08} y={ROW - 0.08} z={0} w={BLOCK + 0.16} d={BLOCK + 0.16} h={0} tone="sunken" />,
        ]
      })}
      {/* The blocks after every channel and pad, nearest last, so none is painted over. */}
      {sources.map((source, i) => {
        const hovering = source.status === 'backfilling'
        const lit = source.status === 'connected' || hovering ? toneColor(source.tone) : undefined
        return (
          <IsoBox
            key={`${source.id}-block`}
            x={FIRST + i * PITCH - BLOCK / 2}
            y={ROW}
            z={hovering ? HOVER : 0}
            w={BLOCK}
            d={BLOCK}
            h={BLOCK}
            tone={lit ? undefined : 'neutral'}
            color={lit}
            float={hovering ? 0.08 : undefined}
          />
        )
      })}
      {sources.map((source, i) =>
        source.status === 'backfilling' ? (
          <Drop key={`${source.id}-drop`} x={FIRST + i * PITCH} y={ROW + BLOCK / 2} from={HOVER - 0.02} to={0.02} />
        ) : null,
      )}
    </IsoScene>
  )
}
