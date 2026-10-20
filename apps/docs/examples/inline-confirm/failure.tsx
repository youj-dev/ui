'use client'

import { InlineConfirm } from '@youj/react'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function revoke() {
  await wait(1100)
  throw new Error('Key in use')
}

export default function InlineConfirmFailure() {
  // The rejection's message shows on the confirm button, then the row folds back to try again.
  return (
    <InlineConfirm
      destructive
      pendingLabel="Revoking…"
      errorLabel={(error) => (error instanceof Error ? error.message : 'Failed')}
      onConfirm={revoke}
    >
      Revoke key
    </InlineConfirm>
  )
}
