'use client'

import { useState } from 'react'
import { RefillMeter, Button } from '@youj/react'

const CAPACITY = 60
const REFILL = 10

export default function RefillMeterDemo() {
  // What the gateway last reported: the tokens left and when it measured them.
  const [bucket, setBucket] = useState<{ value: number; at?: number }>({ value: 44 })

  const send = (requests: number) => {
    const now = Date.now()
    // The bucket refilled since the last report; the requests spend from there.
    const level = Math.min(CAPACITY, bucket.value + (bucket.at ? ((now - bucket.at) / 1000) * REFILL : 0))
    setBucket({ value: Math.max(0, level - requests), at: now })
  }

  return (
    <div className="flex w-full max-w-lg flex-col gap-5">
      <RefillMeter label="checkout-svc" value={bucket.value} updatedAt={bucket.at} capacity={CAPACITY} refillRate={REFILL} burst={20} />
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => send(10)}>
          Send 10 requests
        </Button>
        <Button variant="secondary" size="sm" onClick={() => send(40)}>
          Send a burst of 40
        </Button>
      </div>
    </div>
  )
}
