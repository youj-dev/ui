'use client'

import { useState } from 'react'
import { Dial } from '@youj/react'
import { Demo, TileCard } from './demo'

/** A thermostat's target: drag the knob, scroll it or use the arrow keys. */
export default function DialTile() {
  const [target, setTarget] = useState(21.5)
  return (
    <Demo>
      <TileCard className="max-w-72 items-center px-6 py-8">
        <Dial
          label="Target temperature"
          caption="Heating to"
          value={target}
          onValueChange={setTarget}
          min={12}
          max={28}
          step={0.5}
          current={19.8}
          tone="warm"
          marks={[
            { value: 17, label: 'Away' },
            { value: 21, label: 'Morning' },
          ]}
          format={{ style: 'unit', unit: 'celsius', minimumFractionDigits: 1, maximumFractionDigits: 1 }}
        />
      </TileCard>
    </Demo>
  )
}
