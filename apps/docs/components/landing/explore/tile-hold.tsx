'use client'

import { AsyncButton } from '@youj/react'
import { Demo } from './demo'

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Hold to delete: a full hold runs it, then Deleting… and the drawn check. */
export default function HoldTile() {
  return (
    <Demo>
      <div className="block-glass w-full max-w-64 p-3">
        <AsyncButton variant="danger" hold onAction={() => wait(1200)} pendingLabel="Deleting…" successLabel="Deleted" className="w-full">
          Hold to delete
        </AsyncButton>
      </div>
    </Demo>
  )
}
