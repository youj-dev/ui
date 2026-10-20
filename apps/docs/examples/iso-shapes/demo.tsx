'use client'

import { IsoBox, IsoCylinder, IsoPlatform, IsoScene } from '@youj/illustrations'

/* A bench of parts on a gridded plinth: a solid enclosure with a board on
 * its top face, a wireframe spare beside it, a lit spool, a wire canister,
 * and a ghost where the next enclosure goes. */

export default function IsoShapesDemo() {
  return (
    <div className="mx-auto w-fit max-w-full p-6 sm:p-8">
      <IsoScene unit={24} assemble>
        <IsoPlatform x={0} y={0} w={11} d={7} h={0.5} grid={1}>
          <IsoBox x={7.6} y={3.8} z={0.7} w={2.6} d={2.4} h={0} variant="ghost" />
        </IsoPlatform>
        <IsoBox x={0.9} y={0.9} z={0.7} w={3} d={2.6} h={1.3}>
          {/* Children draw on the top face and move with it. */}
          <IsoBox x={1.2} y={1.2} z={2} w={1.6} d={1.2} h={0.12} tone="raised" />
          <IsoBox x={3.1} y={1.3} z={2} w={0.5} d={0.5} h={0.18} tone="accent" />
        </IsoBox>
        <IsoBox x={4.6} y={0.9} z={0.7} w={2.2} d={2.6} h={1.3} variant="wire" />
        <IsoCylinder x={1.2} y={4.2} z={0.7} r={1} h={0.9} tone="accent" />
        <IsoCylinder x={4.3} y={4.2} z={0.7} r={1} h={1.6} variant="wire" />
      </IsoScene>
    </div>
  )
}
