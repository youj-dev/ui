'use client'

import { DotGrid, IsoGrid, LineGrid } from '@youj/illustrations'

/* The three papers, each filling its panel behind the caption and fading
 * toward the edges. */

const PANELS = [
  { name: 'Dot grid', Grid: DotGrid },
  { name: 'Line grid', Grid: LineGrid },
  { name: 'Iso grid', Grid: IsoGrid },
]

export default function GridBackdropsDemo() {
  return (
    <div className="grid w-full gap-3 p-6 sm:grid-cols-3">
      {PANELS.map(({ name, Grid }) => (
        <figure key={name} className="relative isolate grid h-44 place-items-center overflow-hidden rounded-xl border border-line bg-surface">
          <Grid gap={20} />
          <figcaption className="font-mono text-xs tracking-[0.12em] text-fg-muted uppercase">{name}</figcaption>
        </figure>
      ))}
    </div>
  )
}
