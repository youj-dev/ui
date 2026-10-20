'use client'

import { SlideToConfirm } from '@youj/react'
import { Demo } from './demo'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Slide to pay: the payment runs, the check shows, and it comes back to rest for another go. */
export default function SlideTile() {
  return (
    <Demo>
      <div className="explore-slide block-glass w-full max-w-64 p-3">
        <SlideToConfirm label="Slide to pay" confirmingLabel="Paying…" confirmedLabel="Paid" onConfirm={() => wait(1200)} resetAfter={2500} />
      </div>
    </Demo>
  )
}
