'use client'

import { RefillMeter } from '@youj/react'

export default function RefillMeterBurst() {
  return (
    <div className="flex w-full max-w-lg flex-col gap-8">
      {/* Under the burst marker: a batch of 25 would be partly refused, so the cells turn amber. */}
      <RefillMeter label="batch-sync" value={14} capacity={40} refillRate={5} burst={25} />
      {/* Empty with no refill: every request is refused until the window resets. */}
      <RefillMeter label="POST /v1/embeddings" value={0} capacity={20} />
    </div>
  )
}
