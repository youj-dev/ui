'use client'

import { useState } from 'react'
import { Dial, SegmentedControl, SegmentedControlItem } from '@youj/react'

type Mode = 'heat' | 'cool'

export default function DialDemo() {
  const [mode, setMode] = useState<Mode>('heat')
  const [target, setTarget] = useState(21.5)
  const room = mode === 'heat' ? 19.8 : 25.4
  return (
    <div className="flex w-full max-w-72 flex-col items-center gap-5">
      <SegmentedControl aria-label="Mode" value={mode} onValueChange={(v) => (setMode(v as Mode), setTarget(v === 'heat' ? 21.5 : 23))} className="w-full">
        <SegmentedControlItem value="heat" className="flex-1">
          Heat
        </SegmentedControlItem>
        <SegmentedControlItem value="cool" className="flex-1">
          Cool
        </SegmentedControlItem>
      </SegmentedControl>
      <Dial
        label="Target temperature"
        caption={mode === 'heat' ? 'Heating to' : 'Cooling to'}
        value={target}
        onValueChange={setTarget}
        min={12}
        max={28}
        step={0.5}
        current={room}
        tone={mode === 'heat' ? 'warm' : 'cool'}
        marks={[
          { value: 17, label: 'Away' },
          { value: 18, label: 'Night' },
          { value: 21, label: 'Morning' },
        ]}
        format={{ style: 'unit', unit: 'celsius', minimumFractionDigits: 1, maximumFractionDigits: 1 }}
      />
    </div>
  )
}
