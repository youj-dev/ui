'use client'

import { InlineConfirm } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export default function InlineConfirmPublish() {
  return (
    <InlineConfirm
      variant="secondary"
      prompt="Publish to everyone?"
      confirmLabel="Publish"
      pendingLabel="Publishing…"
      successLabel="Published"
      onConfirm={() => wait(1200)}
    >
      Publish
    </InlineConfirm>
  )
}
