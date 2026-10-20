'use client'

import { IsoScene, IsoStack } from '@youj/illustrations'

/* A charging puck in disks, parted on hover. Only the coil is named in the
 * accent; `dim` quiets the rest around it. */

export default function IsoStackDisks() {
  return (
    <div className="mx-auto w-fit max-w-full p-6">
      <IsoScene explode="hover" unit={26} assemble>
        <IsoStack
          x={0}
          y={0}
          w={3.6}
          d={3.6}
          shape="disk"
          gap={1.1}
          dim
          layers={[
            { id: 'foot', h: 0.3, label: 'foot', detail: 'silicone, non-slip' },
            { id: 'coil', h: 0.25, inset: 0.35, label: 'coil', detail: '15 W, Qi2', lit: true },
            { id: 'magnets', h: 0.15, inset: 0.2, label: 'magnet ring' },
            { id: 'cap', h: 0.3, variant: 'wire', label: 'cap' },
          ]}
        />
      </IsoScene>
    </div>
  )
}
