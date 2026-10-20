'use client'

import { PromptInput } from '@youj/react'

const DRAFT =
  'Summarize the incident for the status page: checkout p95 in fra1 rose from 97 ms to 164 ms after Tuesday’s edge migration, and a rollback to dpl_7c1e0b2 restored it within a minute. Keep it calm and short.'

export default function PromptInputLimit() {
  return (
    <div className="w-full max-w-2xl">
      {/* The counter appears from 80% of the limit, warns at 95% and blocks sending past it. */}
      <PromptInput defaultValue={DRAFT} maxLength={220} label="Status update" placeholder="Write the update…" onSubmit={() => {}} />
    </div>
  )
}
