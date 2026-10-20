'use client'

import { SlideToConfirm } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function transfer() {
  await wait(1100)
  throw new Error('Insufficient funds')
}

export default function SlideToConfirmFailure() {
  return (
    <div className="w-full max-w-sm">
      {/* The rejection's message shows in the track; slide again to retry. */}
      <SlideToConfirm size="sm" label="Slide to transfer" confirmingLabel="Transferring…" onConfirm={transfer} />
    </div>
  )
}
