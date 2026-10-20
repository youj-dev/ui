'use client'

import { IsoBox, IsoFloor, IsoScene, type IsoTone } from '@youj/illustrations'

/* Every tone in the same light: top lightest, left a step down, right the
 * darkest, in either scheme. The last three take any CSS color; token
 * references (the chart palette here) follow the theme. */

const TONES: IsoTone[] = ['neutral', 'raised', 'sunken', 'accent', 'success', 'warning', 'danger']
const SERIES = ['var(--color-chart-2)', 'var(--color-chart-3)', 'var(--color-chart-4)']

export default function IsoShapesTones() {
  return (
    <div className="mx-auto w-fit max-w-full p-6">
      <IsoScene unit={20}>
        <IsoFloor w={(TONES.length + SERIES.length) * 2.6 + 0.6} d={3.2} />
        {TONES.map((tone, i) => (
          <IsoBox key={tone} x={0.6 + i * 2.6} y={0.6} w={2} d={2} h={1.6} tone={tone} />
        ))}
        {SERIES.map((color, i) => (
          <IsoBox key={color} x={0.6 + (TONES.length + i) * 2.6} y={0.6} w={2} d={2} h={1.6} color={color} />
        ))}
      </IsoScene>
    </div>
  )
}
