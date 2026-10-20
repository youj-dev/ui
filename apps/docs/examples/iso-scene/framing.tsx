'use client'

import { IsoBox, IsoCylinder, IsoFloor, IsoScene, IsoStack } from '@youj/illustrations'

/* Three small scenes that must line up in a row. Fitted to their content,
 * each would frame differently; `size` gives them one volume, so their
 * floors sit on the same line and their shapes at the same scale. */

const SIZE = [4, 4, 3.4] as const

export default function IsoSceneFraming() {
  return (
    <div className="mx-auto grid w-fit max-w-full grid-cols-3 gap-3 p-6">
      <figure className="rounded-xl border border-line bg-canvas p-3">
        <IsoScene size={SIZE} unit={20} pad={8}>
          <IsoFloor w={4} d={4} />
          <IsoBox x={1} y={1} w={2} d={2} h={1.2} />
        </IsoScene>
      </figure>
      <figure className="rounded-xl border border-line bg-canvas p-3">
        <IsoScene size={SIZE} unit={20} pad={8}>
          <IsoFloor w={4} d={4} />
          <IsoCylinder x={1} y={1} r={1} h={2.2} tone="accent" />
        </IsoScene>
      </figure>
      <figure className="rounded-xl border border-line bg-canvas p-3">
        <IsoScene size={SIZE} unit={20} pad={8}>
          <IsoFloor w={4} d={4} />
          <IsoStack
            x={0.8}
            y={0.8}
            w={2.4}
            d={2.4}
            layers={[
              { id: 'a', h: 0.5 },
              { id: 'b', h: 0.5, inset: 0.2 },
              { id: 'c', h: 0.5, inset: 0.4 },
            ]}
          />
        </IsoScene>
      </figure>
    </div>
  )
}
