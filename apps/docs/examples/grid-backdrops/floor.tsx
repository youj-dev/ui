'use client'

import { IsoBox, IsoFloor, IsoScene } from '@youj/illustrations'

/* IsoFloor draws a scene's own grid in its units, so shapes land on its
 * lines: the same slab on lines, and on dots at the crossings. */

export default function GridBackdropsFloor() {
  return (
    <div className="mx-auto grid w-fit max-w-full grid-cols-2 gap-6 p-6">
      <IsoScene unit={22}>
        <IsoFloor w={6} d={5} />
        <IsoBox x={1} y={1} w={3} d={2} h={1} />
      </IsoScene>
      <IsoScene unit={22}>
        <IsoFloor w={6} d={5} kind="dots" />
        <IsoBox x={1} y={1} w={3} d={2} h={1} tone="accent" />
      </IsoScene>
    </div>
  )
}
