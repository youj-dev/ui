'use client'

import { useState } from 'react'
import { IsoBox, IsoScene, IsoStack, LineGrid } from '@youj/illustrations'

/* An e-reader, taken apart. The separation springs to the toggle's value, so
 * pressing it again mid-way turns the parts round from where they are. The
 * display is the part that matters here: it's lit, and the rest dim. */

export default function IsoStackDemo() {
  const [apart, setApart] = useState(true)
  return (
    <div className="relative isolate mx-auto w-fit max-w-full p-6 sm:p-8">
      <LineGrid gap={20} />
      <IsoScene explode={apart} unit={26} title="An e-reader, exploded: back cover, battery, logic board, display and front glass">
        <IsoStack
          x={0}
          y={0}
          w={4.4}
          d={3.2}
          gap={1.25}
          dim
          layers={[
            { id: 'back', h: 0.35, label: 'back cover', detail: 'recycled aluminum' },
            { id: 'battery', h: 0.3, inset: 0.35, label: 'battery', detail: '1,700 mAh' },
            {
              id: 'board',
              h: 0.12,
              inset: 0.25,
              label: 'logic board',
              detail: 'one SoC, no fan',
              content: ({ x, y, z }) => (
                <>
                  <IsoBox x={x + 0.4} y={y + 0.4} z={z} w={1.1} d={1.1} h={0.12} tone="raised" />
                  <IsoBox x={x + 1.8} y={y + 0.5} z={z} w={0.6} d={0.9} h={0.08} />
                </>
              ),
            },
            { id: 'display', h: 0.14, label: 'display', detail: '7 in, 300 ppi', lit: true },
            { id: 'glass', h: 0.12, variant: 'wire', label: 'front glass', detail: 'etched, anti-glare' },
          ]}
        />
      </IsoScene>
      <button
        type="button"
        aria-pressed={apart}
        onClick={() => setApart((a) => !a)}
        className="mx-auto mt-4 flex rounded-full border border-line bg-surface px-3.5 py-1.5 text-sm font-medium text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
      >
        {apart ? 'Put it together' : 'Take it apart'}
      </button>
    </div>
  )
}
