'use client'

import { IsoBox, IsoCylinder, IsoScene, IsoStack, type IsoStackLayer } from '@youj/illustrations'
import { useIsMobile } from '../../../hooks/use-mobile'
import { LAYERS, partOf, type ExplodedViewPart, type PartId } from './data'

/* The gateway as an exploded technical drawing: five layers on one axis,
 * each named on the rail beside it. The part being talked about is lit in
 * the accent, so the figures below and the drawing point at the same thing. */

type Top = { x: number; y: number; z: number; w: number; d: number }

/** What sits on each layer's top face, in the layer's own footprint. */
const DETAILS: Partial<Record<PartId, (top: Top) => React.ReactNode>> = {
  mainboard: ({ x, y, z, w, d }) => (
    <>
      {/* The modem can, the ethernet magnetics along the near edge, and two antenna posts. */}
      <IsoBox x={x + 0.35} y={y + 0.35} z={z} w={1.3} d={1.1} h={0.16} tone="raised" />
      <IsoBox x={x + w - 1.25} y={y + d - 0.75} z={z} w={0.45} d={0.5} h={0.22} />
      <IsoBox x={x + w - 0.7} y={y + d - 0.75} z={z} w={0.45} d={0.5} h={0.22} />
      <IsoCylinder x={x + 0.3} y={y + d - 0.6} z={z} r={0.16} h={0.3} tone="raised" />
      <IsoCylinder x={x + w - 0.6} y={y + 0.3} z={z} r={0.16} h={0.3} tone="raised" />
      <IsoBox x={x + 1.9} y={y + 0.5} z={z} w={1.9} d={2.2} h={0} variant="ghost" />
    </>
  ),
  compute: ({ x, y, z, w, d }) => <IsoBox x={x + w / 2 - 0.55} y={y + d / 2 - 0.5} z={z} w={1.1} d={1} h={0.1} tone="accent" />,
  spreader: ({ x, y, z, w, d }) => (
    <>
      {Array.from({ length: 7 }, (_, i) => (
        <IsoBox key={i} x={x + 0.35 + i * ((w - 0.9) / 6)} y={y + 0.3} z={z} w={0.18} d={d - 0.6} h={0.2} />
      ))}
    </>
  ),
}

export function Drawing({ title, parts, lit, exploded }: { title: string; parts: ExplodedViewPart[]; lit: PartId; exploded: boolean }) {
  const mobile = useIsMobile()
  const layers: IsoStackLayer[] = LAYERS.map((part) => ({
    id: part.id,
    h: part.h,
    inset: part.inset,
    variant: part.wire ? 'wire' : undefined,
    label: partOf(parts, part.id).name,
    // A phone's drawing is too small for two lines a part: names only.
    detail: mobile ? undefined : partOf(parts, part.id).detail || undefined,
    lit: part.id === lit,
    content: DETAILS[part.id],
  }))
  return (
    <IsoScene
      title={title}
      explode={exploded ? 1 : 0}
      assemble
      unit={mobile ? 22 : 28}
      rail={mobile ? 116 : 176}
      pad={[20, 16, 12, 16]}
    >
      <IsoStack x={0} y={0} w={6} d={4} gap={1.25} layers={layers} />
    </IsoScene>
  )
}
