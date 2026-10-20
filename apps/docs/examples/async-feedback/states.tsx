'use client'

import { motion } from 'motion/react'
import { cn } from '@youj/core'
import { AsyncFeedback, useMorphRoot, type AsyncState } from '@youj/motion'
import { CloudUploadIcon } from '@youj/icons'

const STATES: AsyncState[] = ['idle', 'pending', 'success', 'error']

function Specimen({ state }: { state: AsyncState }) {
  const morph = useMorphRoot(8)
  return (
    <figure className="flex flex-col items-center gap-2.5">
      {/* A static picture of each state, so it isn't a button. Press Replay to draw the marks again. */}
      <motion.span
        {...morph}
        className={cn(
          'relative inline-flex h-8 items-center overflow-hidden border border-line bg-surface px-3 text-[13px] font-medium text-fg',
          (state === 'success' || state === 'error') && 'border-transparent text-on-accent',
        )}
      >
        <AsyncFeedback state={state} pendingLabel="Publishing…" successLabel="Published" errorLabel="Couldn’t publish">
          <CloudUploadIcon size={14} />
          Publish
        </AsyncFeedback>
      </motion.span>
      <figcaption className="font-mono text-xs text-fg-muted">{state}</figcaption>
    </figure>
  )
}

export default function AsyncFeedbackStates() {
  return (
    <div className="grid grid-cols-2 gap-x-10 gap-y-6 sm:flex sm:justify-center">
      {STATES.map((state) => (
        <Specimen key={state} state={state} />
      ))}
    </div>
  )
}
