'use client'

import { useState } from 'react'
import { Dial } from '@youj/react'

export default function DialTicks() {
  const [humidity, setHumidity] = useState(42)
  return (
    <div className="w-full max-w-64">
      <Dial
        variant="ticks"
        label="Humidity"
        value={humidity}
        onValueChange={setHumidity}
        format={{ style: 'unit', unit: 'percent' }}
        bands={[
          { from: 0, tone: 'warm' },
          { from: 30, tone: 'success' },
          { from: 60, tone: 'chart-5' },
        ]}
      />
    </div>
  )
}
