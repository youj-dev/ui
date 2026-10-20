'use client'

import { IsoBox, IsoPlatform, IsoScene, type IsoTone, type IsoVariant } from '@youj/illustrations'
import type { SetupShape } from './data'

/* One small drawing per deployment shape, framed alike (the same volume) so
 * the three cards line up. Unchosen, a shape is a wireframe: a plan of what
 * it would be. Chosen, it's built: the nodes drop onto their plinths on the
 * settle spring, the primary in the accent. Remounting on the choice replays
 * the build; under reduced motion it's simply there. */

const VOLUME = [7, 7, 3.2] as const

interface Node {
  x: number
  y: number
  primary?: boolean
}

const PLANS: Record<SetupShape, { plinths: [x: number, y: number, w: number][]; nodes: Node[] }> = {
  single: { plinths: [[2, 2, 3]], nodes: [{ x: 2.75, y: 2.75, primary: true }] },
  replicated: {
    plinths: [[0.8, 0.8, 5.4]],
    nodes: [
      { x: 1.6, y: 3.9, primary: true },
      { x: 3.9, y: 1.6 },
      { x: 3.9, y: 3.9 },
    ],
  },
  regions: {
    plinths: [
      [0.2, 4.2, 2.6],
      [4.2, 0.2, 2.6],
      [4.2, 4.2, 2.6],
    ],
    nodes: [
      { x: 0.85, y: 4.85, primary: true },
      { x: 4.85, y: 0.85 },
      { x: 4.85, y: 4.85 },
    ],
  },
}

export function SetupShapeScene({ shape, chosen }: { shape: SetupShape; chosen: boolean }) {
  const plan = PLANS[shape] ?? PLANS.single
  const variant: IsoVariant = chosen ? 'solid' : 'wire'
  const tone = (n: Node): IsoTone => (chosen && n.primary ? 'accent' : chosen ? 'raised' : 'neutral')
  return (
    // Keyed on the choice, so choosing rebuilds it from the plan.
    <IsoScene key={String(chosen)} size={VOLUME} unit={19} pad={4} assemble={chosen} data-shape={shape} data-chosen={chosen || undefined}>
      {plan.plinths.map(([x, y, w]) => (
        <IsoPlatform key={`${x}-${y}`} x={x} y={y} w={w} d={w} h={0.35} lip={0.12} inset={0.22} variant={variant} hidden={false} />
      ))}
      {plan.nodes.map((n) => (
        <IsoBox key={`${n.x}-${n.y}`} x={n.x} y={n.y} z={0.47} w={1.5} d={1.5} h={n.primary ? 1.9 : 1.4} tone={tone(n)} variant={variant} />
      ))}
    </IsoScene>
  )
}
