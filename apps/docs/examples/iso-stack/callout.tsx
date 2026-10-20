'use client'

import { IsoBox, IsoCallout, IsoCylinder, IsoScene } from '@youj/illustrations'

/* IsoCallout names any point, not just a stack's layers: here the status
 * light and the uplink port of a small router. Each leader runs to the rail. */

export default function IsoStackCallout() {
  return (
    <div className="mx-auto w-fit max-w-full p-6">
      <IsoScene unit={28}>
        <IsoBox x={0} y={0} w={4.4} d={3} h={0.9}>
          <IsoCylinder x={3.6} y={0.3} z={0.9} r={0.2} h={0.05} tone="success" />
          <IsoBox x={0.4} y={0.4} z={0.9} w={2.2} d={0.6} h={0.04} tone="sunken" />
        </IsoBox>
        <IsoCallout at={[3.8, 0.5, 0.95]} label="status" detail="green: online" lit />
        <IsoCallout at={[4.4, 1.5, 0.45]} label="uplink" detail="2.5 GbE" />
      </IsoScene>
    </div>
  )
}
