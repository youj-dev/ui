'use client'

import { useState } from 'react'
import { LimitMeter, Button } from '@youj/react'

export default function LimitMeterDemo() {
  const [spent, setSpent] = useState(1240)
  const [limit, setLimit] = useState(2000)
  return (
    <div className="flex w-full max-w-xl flex-col gap-5">
      <LimitMeter
        spent={spent}
        limit={limit}
        format={{ style: 'currency', currency: 'EUR' }}
        markers={[{ value: 1800, label: 'freeze', tone: 'warning' }]}
        label="Card limit"
      />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => setSpent((s) => s + 180)}>
          Charge €180
        </Button>
        <Button size="sm" variant="outline" onClick={() => setLimit((l) => l + 250)}>
          Raise limit €250
        </Button>
        <Button size="sm" variant="ghost" onClick={() => (setSpent(1240), setLimit(2000))}>
          Reset
        </Button>
      </div>
    </div>
  )
}
