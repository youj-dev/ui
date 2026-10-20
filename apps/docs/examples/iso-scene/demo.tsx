'use client'

import { DotGrid, IsoBox, IsoCylinder, IsoFloor, IsoPlatform, IsoScene, IsoStack } from '@youj/illustrations'

/* An ingest pod: a queue of jobs on a plinth, feeding a worker at its end.
 * It assembles the first time it scrolls into view; hover it to take the
 * worker apart, and its parts are named on the rail beside the drawing. */

const JOBS = [0, 1, 2, 3]

export default function IsoSceneDemo() {
  return (
    <div className="relative isolate mx-auto w-fit max-w-full p-6 sm:p-8">
      <DotGrid gap={18} />
      <IsoScene assemble explode="hover" unit={22} title="An ingest pod: four jobs queued on a plinth, feeding a worker">
        <IsoFloor w={13} d={8} kind="dots" />
        <IsoPlatform x={0.5} y={0.5} w={12} d={7} h={0.4} grid={1}>
          {/* The next job's place in the queue, marked out. */}
          <IsoBox x={1.1} y={4.4} z={0.6} w={1.2} d={1.2} h={0} variant="ghost" />
        </IsoPlatform>
        {JOBS.map((i) => (
          <IsoBox key={i} x={2.9 + i * 1.7} y={4.4} z={0.6} w={1.2} d={1.2} h={0.9} tone={i === JOBS.length - 1 ? 'accent' : 'neutral'} />
        ))}
        <IsoStack
          x={8.4}
          y={1.2}
          z={0.6}
          w={3.2}
          d={2.6}
          gap={1.2}
          layers={[
            { id: 'chassis', h: 0.6, label: 'worker', detail: 'pulls one job at a time' },
            { id: 'runtime', h: 0.3, inset: 0.35, label: 'runtime', detail: 'isolated per job', lit: true },
            { id: 'cover', h: 0.5, variant: 'wire', label: 'cover' },
          ]}
        />
        <IsoCylinder x={5.4} y={1.3} z={0.6} r={0.7} h={0.5} tone="raised" float />
      </IsoScene>
    </div>
  )
}
