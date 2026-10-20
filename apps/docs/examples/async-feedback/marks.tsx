'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { AsyncAnnouncer, AsyncFeedback, useAsyncAction, useMorphRoot } from '@youj/motion'
import { CheckCircleIcon, LoaderDotsIcon, RefreshIcon } from '@youj/icons'

const LABELS = { pendingLabel: 'Syncing…', successLabel: 'Synced', errorLabel: 'Sync failed' }

// A stand-in for your API.
const syncRepository = () => new Promise<void>((resolve) => setTimeout(resolve, 1200))

export default function AsyncFeedbackMarks() {
  const [lastSync, setLastSync] = useState('12 minutes ago')
  const { state, run } = useAsyncAction(async () => {
    await syncRepository()
    setLastSync('just now')
  })
  const morph = useMorphRoot(8)

  return (
    <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-fg">northwind/web</p>
        <p className="text-xs text-fg-muted">Last synced {lastSync}</p>
      </div>
      {/* A quiet secondary control: its own marks, and no tint. */}
      <motion.button
        type="button"
        {...morph}
        onClick={run}
        aria-busy={state === 'pending' || undefined}
        className="relative inline-flex h-8 shrink-0 items-center overflow-hidden border border-line bg-surface px-3 text-[13px] font-medium text-fg outline-none hover:bg-raised focus-visible:ring-2 focus-visible:ring-accent"
      >
        <AsyncFeedback
          state={state}
          {...LABELS}
          tint={false}
          icons={{
            pending: <LoaderDotsIcon size={16} />,
            success: <CheckCircleIcon size={15} trigger="mount" className="text-success" />,
          }}
        >
          <RefreshIcon size={14} />
          Sync
        </AsyncFeedback>
      </motion.button>
      <AsyncAnnouncer state={state} {...LABELS} />
    </div>
  )
}
